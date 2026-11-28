/**
 * front#664, PR 1 (contrat back #1797) : la fiche de l'élève, onglets Identité et Tuteurs. Vrai client HTTP
 * (`api`, adaptateur simulé), vrai store.
 *
 * - `GET /eleves/{eleve}/dossier` : `{ eleve_id, source: lms|klassci, dossier|null }`.
 * - Écriture (`PUT /eleves/{eleve}/dossier`, tuteurs) : la GESTION (coordinateur, admin, superAdmin) d'une école
 *   AUTONOME (`source: lms`). Ailleurs, lecture seule, et l'écran ne propose rien.
 * - 409 `doublon_possible` : les candidats s'affichent ; « Enregistrer quand même » renvoie `confirmer_doublon: true`.
 * - Les onglets sans route serveur (Classes, Notes, Présences, Documents) restent masqués : aucun faux contenu.
 * - La fiche s'atteint depuis un écran en place, et seulement là où elle s'ouvre : une ligne d'élève d'« Utilisateurs »
 *   qui porte son id LOCAL, l'onglet Étudiants d'une classe LOCALE (son roster porte des id locaux).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const h = vi.hoisted(() => ({ confirm: vi.fn() }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: h.confirm }) }))

import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import FicheEleve from '@/components/eleves/FicheEleve.vue'
import UsersTable from '@/components/admin/UsersTable.vue'
import ClasseEtudiantsTab from '@/components/classes/ClasseEtudiantsTab.vue'

const LIEN = { props: ['to'], template: '<a class="lien" :href="typeof to === \'string\' ? to : to.path"><slot /></a>' }
const TUTEUR = { id: 5, relation: 'mere', nom: 'Adjoua Kouassi', telephone: '0700000000', courriel: null, profession: null, adresse: null }
const DOSSIER = {
  matricule: '2026-0001', nom: 'Kouassi', prenoms: 'Aya', genre: 'F', date_naissance: '2010-03-14', lieu_naissance: 'Abidjan',
  nationalite: 'CI', adresse: null, ville: 'Abidjan', commune: 'Cocody', statut: 'actif', photo_url: null, tuteurs: [TUTEUR],
}

let requetes
let reponses
let adaptateurOrigine

function repondre(statut, corps) {
  return { statut, corps }
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().user = { id: 1, name: 'Admin', role: 'admin' }
  h.confirm.mockReset().mockResolvedValue(true)
  requetes = []
  reponses = { 'get /eleves/42/dossier': repondre(200, { success: true, data: { eleve_id: 42, source: 'lms', dossier: DOSSIER } }) }
  adaptateurOrigine = api.defaults.adapter
  api.defaults.adapter = async (config) => {
    const cle = `${config.method} ${config.url}`
    requetes.push({ cle, corps: config.data ? JSON.parse(config.data) : undefined })
    const { statut, corps } = reponses[cle] ?? repondre(500, { success: false, message: `imprévu : ${cle}` })
    const reponse = { status: statut, statusText: '', headers: { 'content-type': 'application/json' }, config, data: JSON.stringify(corps) }
    if (statut >= 400) {
      const erreur = new Error(`HTTP ${statut}`)
      Object.assign(erreur, { isAxiosError: true, config, response: { ...reponse, data: corps } })
      throw erreur
    }
    return reponse
  }
})

afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

async function fiche() {
  const w = mount(FicheEleve, { props: { eleveId: 42 }, global: { stubs: { RouterLink: LIEN, teleport: true } } })
  await flushPromises()
  return w
}

const ecritures = () => requetes.filter((r) => !r.cle.startsWith('get '))

describe('front#664 — la fiche se lit', () => {
  it('identité et tuteurs, sans onglet dont le serveur n existe pas', async () => {
    const w = await fiche()

    expect(w.text()).toContain('Kouassi Aya')
    expect(w.text()).toContain('2026-0001')
    expect(w.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Identité', 'Tuteurs'])
    await w.find('[data-test="onglet-tuteurs"]').trigger('click')
    expect(w.text()).toContain('Adjoua Kouassi')
    expect(w.text()).not.toMatch(/Présences|Documents/)
  })

  it('un refus du serveur s affiche, sans fiche inventée', async () => {
    reponses['get /eleves/42/dossier'] = repondre(404, { success: false, message: 'Élève introuvable dans cet établissement.' })
    const w = await fiche()

    expect(w.find('[role="alert"]').text()).not.toBe('')
    expect(w.find('[data-test="onglet-identite"]').exists()).toBe(false)
  })
})

describe('front#664 — la gestion d une école autonome écrit', () => {
  it('modifier l identité : PUT du dossier, puis la fiche suit la réponse', async () => {
    reponses['put /eleves/42/dossier'] = repondre(200, { success: true, data: { eleve_id: 42, source: 'lms', dossier: { ...DOSSIER, ville: 'Bouaké' } } })
    const w = await fiche()

    await w.find('[data-test="modifier-identite"]').trigger('click')
    await w.find('[data-champ="ville"]').setValue('Bouaké')
    await w.find('[data-test="formulaire-identite"]').trigger('submit')
    await flushPromises()

    expect(ecritures()).toHaveLength(1)
    expect(ecritures()[0]).toMatchObject({ cle: 'put /eleves/42/dossier', corps: { nom: 'Kouassi', prenoms: 'Aya', ville: 'Bouaké' } })
    expect(ecritures()[0].corps).not.toHaveProperty('confirmer_doublon')
    expect(w.text()).toContain('Bouaké')
  })

  it('un doublon possible : les candidats, puis « Enregistrer quand même » confirme', async () => {
    reponses['get /eleves/42/dossier'] = repondre(200, { success: true, data: { eleve_id: 42, source: 'lms', dossier: null } })
    reponses['put /eleves/42/dossier'] = repondre(409, {
      success: false, reason: 'doublon_possible', message: 'Un élève porte déjà ce nom.',
      candidats: [{ eleve_id: 7, nom: 'Kouassi', prenoms: 'Aya', matricule: '2025-0042' }],
    })
    const w = await fiche()
    expect(w.find('[data-test="aucun-dossier"]').exists()).toBe(true)

    await w.find('[data-test="creer-dossier"]').trigger('click')
    await w.find('[data-champ="nom"]').setValue('Kouassi')
    await w.find('[data-champ="prenoms"]').setValue('Aya')
    await w.find('[data-test="formulaire-identite"]').trigger('submit')
    await flushPromises()

    expect(w.find('[data-test="doublon"]').text()).toContain('2025-0042')
    reponses['put /eleves/42/dossier'] = repondre(201, { success: true, data: { eleve_id: 42, source: 'lms', dossier: { ...DOSSIER, tuteurs: [] } } })
    await w.find('[data-test="confirmer-doublon"]').trigger('click')
    await flushPromises()

    expect(ecritures().map((r) => r.corps.confirmer_doublon)).toEqual([undefined, true])
    expect(w.find('[data-test="doublon"]').exists()).toBe(false)
  })

  it('les tuteurs : ajouter, modifier, retirer après confirmation', async () => {
    reponses['post /eleves/42/tuteurs'] = repondre(201, { success: true, data: { ...TUTEUR, id: 6, relation: 'pere', nom: 'Koffi Kouassi' } })
    reponses['put /tuteurs/5'] = repondre(200, { success: true, data: { ...TUTEUR, telephone: '0500000000' } })
    reponses['delete /eleves/42/tuteurs/5'] = repondre(200, { success: true, data: null })
    const w = await fiche()
    await w.find('[data-test="onglet-tuteurs"]').trigger('click')

    await w.find('[data-test="ajouter-tuteur"]').trigger('click')
    await w.find('[data-champ-tuteur="relation"]').setValue('pere')
    await w.find('[data-champ-tuteur="nom"]').setValue('Koffi Kouassi')
    await w.find('[data-test="formulaire-tuteur"]').trigger('submit')
    await flushPromises()
    expect(w.text()).toContain('Koffi Kouassi')

    await w.find('[data-test="modifier-tuteur-5"]').trigger('click')
    await w.find('[data-champ-tuteur="telephone"]').setValue('0500000000')
    await w.find('[data-test="formulaire-tuteur"]').trigger('submit')
    await flushPromises()

    await w.find('[data-test="retirer-tuteur-5"]').trigger('click')
    await flushPromises()

    expect(ecritures().map((r) => r.cle)).toEqual(['post /eleves/42/tuteurs', 'put /tuteurs/5', 'delete /eleves/42/tuteurs/5'])
    expect(ecritures()[0].corps).toMatchObject({ relation: 'pere', nom: 'Koffi Kouassi' })
    expect(ecritures()[1].corps).not.toHaveProperty('relation')
    expect(h.confirm).toHaveBeenCalledTimes(1)
    expect(w.text()).not.toContain('Adjoua Kouassi')
  })

  it('un retrait annulé n envoie rien', async () => {
    h.confirm.mockResolvedValue(false)
    const w = await fiche()
    await w.find('[data-test="onglet-tuteurs"]').trigger('click')

    await w.find('[data-test="retirer-tuteur-5"]').trigger('click')
    await flushPromises()

    expect(ecritures()).toEqual([])
  })
})

describe('front#664 — ailleurs, lecture seule', () => {
  it('école KLASSCI : rien à modifier, et la raison est dite', async () => {
    reponses['get /eleves/42/dossier'] = repondre(200, {
      success: true, data: { eleve_id: 42, source: 'klassci', dossier: { ...DOSSIER, matricule: null, tuteurs: [] } },
    })
    const w = await fiche()

    expect(w.find('[data-test="lecture-seule"]').text()).toMatch(/KLASSCI/)
    expect(w.find('[data-test="modifier-identite"]').exists()).toBe(false)
    await w.find('[data-test="onglet-tuteurs"]').trigger('click')
    expect(w.find('[data-test="ajouter-tuteur"]').exists()).toBe(false)
  })

  it('un enseignant lit, sans rien pouvoir modifier', async () => {
    useAuthStore().user = { id: 9, name: 'Prof', role: 'enseignant' }
    const w = await fiche()

    expect(w.find('[data-test="modifier-identite"]').exists()).toBe(false)
    await w.find('[data-test="onglet-tuteurs"]').trigger('click')
    expect(w.find('[data-test="ajouter-tuteur"]').exists()).toBe(false)
    expect(w.find('[data-test="retirer-tuteur-5"]').exists()).toBe(false)
  })
})

describe('front#664 — la fiche s atteint, seulement là où elle s ouvre', () => {
  const lignes = [
    { _uid: 'etu-42', lms_id: 42, name: 'Aya Kouassi', email: 'aya@e.test', role: 'etudiant' },
    { _uid: 'etu-k9', klassci_id: 9, name: 'Élève KLASSCI', email: 'k@e.test', role: 'etudiant' },
    { _uid: 'lms-3', lms_id: 3, name: 'Cora', email: 'cora@e.test', role: 'coordinateur' },
  ]

  it('Utilisateurs : un élève à l id local mène à sa fiche ; sans id local, ou pas un élève, aucun lien', () => {
    const w = mount(UsersTable, { props: { users: lignes, sortField: 'name', sortAsc: true }, global: { stubs: { RouterLink: LIEN } } })

    expect(w.findAll('[data-test="fiche-eleve"]').map((a) => a.attributes('href'))).toEqual(['/eleves/42'])
  })

  it('une classe locale : chaque élève mène à sa fiche ; une classe KLASSCI, aucun lien', () => {
    const etudiants = [{ id: 42, nom_complet: 'Aya Kouassi' }, { id: 43, nom_complet: 'Moussa Traoré' }]
    const locale = mount(ClasseEtudiantsTab, { props: { etudiants, ficheOuvrable: true }, global: { stubs: { RouterLink: LIEN } } })
    const klassci = mount(ClasseEtudiantsTab, { props: { etudiants }, global: { stubs: { RouterLink: LIEN } } })

    expect(locale.findAll('[data-test="fiche-eleve"]').map((a) => a.attributes('href'))).toEqual(['/eleves/42', '/eleves/43'])
    expect(klassci.find('[data-test="fiche-eleve"]').exists()).toBe(false)
  })
})
