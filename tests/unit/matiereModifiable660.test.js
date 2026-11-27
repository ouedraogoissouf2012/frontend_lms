/**
 * #660 (lms_backend#1653) : modifier une matière de l'école, et modifier ou réduire le programme d'une classe.
 *
 * Contrat : `PATCH /matieres/{matiere}` (libellé, code, description, coefficient, crédit ; un code vide part nul),
 * `PATCH /classes/{c}/matieres/{m}` (`enseignant_id`, `coefficient` de classe, nuls compris) et
 * `DELETE /classes/{c}/matieres/{m}`. Refus nommés : `subject_code_already_used` (422, sous le code) et
 * `subject_in_use_in_class` (409). Lectures : `edition` (valeurs brutes, matière locale seulement) dans
 * `/admin/matieres`, `coefficient_classe` dans le programme de la fiche de classe.
 *
 * Le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import MatiereCreation from '@/components/admin/MatiereCreation.vue'
import MatiereModification from '@/components/admin/MatiereModification.vue'
import MatieresTable from '@/components/admin/MatieresTable.vue'
import ProgrammeEdition from '@/components/classes/ProgrammeEdition.vue'
import ClasseMatieresTab from '@/components/classes/ClasseMatieresTab.vue'

const confirmer = vi.fn()
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmer(...a) }) }))

let adaptateurOrigine
let requetes

/** Un adaptateur qui répond selon la méthode et l'URL ; `[null]` : aucune réponse. */
function servir(routes) {
  api.defaults.adapter = async (config) => {
    const cle = `${config.method} ${config.url}`
    requetes.push({ cle, corps: config.data === undefined ? undefined : JSON.parse(config.data) })
    const [status, data] = routes[cle] ?? [599, { success: false }]
    if (status === null) throw new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED, config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

const ecritures = () => requetes.filter((r) => !r.cle.startsWith('get '))
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)
function description(w, nom) {
  const ids = (champ(w, nom).attributes('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  return ids.map((id) => w.find(`#${id}`)).filter((e) => e.exists()).map((e) => e.text()).join(' ')
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  confirmer.mockReset()
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#660 — les chemins', () => {
  it('ceux de la spec, sans préfixe /lms', () => {
    expect(endpoints.catalogue.matiere(7)).toBe('/matieres/7')
    expect(endpoints.catalogue.ligneProgramme(12, 7)).toBe('/classes/12/matieres/7')
  })
})

// ─────────────────────────────────────────────── Modifier une matière ───────────────────────────────────────────────

const MATIERE = {
  id: 7, nom: 'Bureautique', code: 'N/A', coefficient: 2,
  edition: { libelle: 'Bureautique', code: null, description: null, coefficient: 2, credit: 5 },
}
const MODIFIER = `patch ${endpoints.catalogue.matiere(7)}`

async function modifier(routes, saisies = {}) {
  servir(routes)
  const w = mount(MatiereModification, { props: { matiere: MATIERE } })
  for (const [nom, valeur] of Object.entries(saisies)) await champ(w, nom).setValue(valeur)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

describe('#660 — « Modifier » une matière (PATCH /matieres/{matiere})', () => {
  it('le formulaire part des valeurs BRUTES : un code nul reste vide, jamais « N/A »', () => {
    const w = mount(MatiereModification, { props: { matiere: MATIERE } })
    expect(champ(w, 'libelle').element.value).toBe('Bureautique')
    expect(champ(w, 'code').element.value).toBe('')
    expect(champ(w, 'credit').element.value).toBe('5')
  })

  it('envoie les cinq champs, un code vide nul, et émet la matière RELUE', async () => {
    const relue = { id: 7, libelle: 'Bureautique avancée', code: 'BUR-2', description: null, coefficient: 3, credit: 5 }
    const w = await modifier({ [MODIFIER]: [200, { success: true, data: relue }] }, { libelle: 'Bureautique avancée', coefficient: '3' })
    expect(ecritures()).toEqual([{ cle: MODIFIER, corps: { libelle: 'Bureautique avancée', code: null, description: null, coefficient: 3, credit: 5 } }])
    expect(w.emitted('modifiee')[0][0]).toEqual(relue)
  })

  it('un code déjà employé dans l’école : le motif du catalogue, SOUS le champ code', async () => {
    const refus = { success: false, message: 'Texte serveur', reason: 'subject_code_already_used', errors: { code: ['Texte serveur'] } }
    const w = await modifier({ [MODIFIER]: [422, refus] }, { code: 'BUR-1' })
    expect(description(w, 'code')).toContain(ERROR_MESSAGES.matiereCodeDejaPris)
    expect(champ(w, 'code').attributes('aria-invalid')).toBe('true')
    expect(w.find('[role="alert"]').text()).toBe('')
    expect(w.emitted('modifiee')).toBeUndefined()
  })

  it('un coefficient illisible est refusé SANS appel réseau', async () => {
    const w = await modifier({}, { coefficient: '21' })
    expect(ecritures()).toEqual([])
    expect(description(w, 'coefficient')).toContain(ERROR_MESSAGES.matiereCoefficientIllisible)
  })

  it('sans réponse : modification incertaine, dite, et la liste doit être relue', async () => {
    const w = await modifier({ [MODIFIER]: [null] })
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.matiereModificationIncertaine)
    expect(w.emitted('incertaine')).toHaveLength(1)
  })

  it('la création range aussi le code déjà employé sous son champ', async () => {
    servir({ [`post ${endpoints.catalogue.matieres}`]: [422, { success: false, message: 'x', reason: 'subject_code_already_used', errors: { code: ['x'] } }] })
    const w = mount(MatiereCreation)
    await champ(w, 'libelle').setValue('Doublon')
    await champ(w, 'code').setValue('BUR-1')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(description(w, 'code')).toContain(ERROR_MESSAGES.matiereCodeDejaPris)
  })
})

describe('#660 — le tableau des matières', () => {
  it('« Modifier » seulement sur une matière qui porte `edition`, et seulement pour qui gère le catalogue', async () => {
    const miroir = { id: 8, nom: 'Physique KLASSCI', coefficient: 1 }
    const gere = mount(MatieresTable, { props: { matieres: [MATIERE, miroir], modifiable: true } })
    const boutons = gere.findAll('button').filter((b) => b.text() === 'Modifier')
    expect(boutons).toHaveLength(1)
    expect(boutons[0].attributes('aria-label')).toBe('Modifier la matière Bureautique')
    await boutons[0].trigger('click')
    expect(gere.emitted('modifier')[0][0]).toEqual(MATIERE)

    const lecteur = mount(MatieresTable, { props: { matieres: [MATIERE], modifiable: false } })
    expect(lecteur.findAll('button').filter((b) => b.text() === 'Modifier')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────── Le programme d'une classe ───────────────────────────────────────────────

const PROGRAMME = [
  { id: 5, nom: 'Maths fictive', coefficient: 2, coefficient_classe: 4, enseignants: [{ id: 31, nom: 'Awa Fictive' }] },
  { id: 6, nom: 'SVT fictive', coefficient: 3, coefficient_classe: null, enseignants: [] },
]
const ENSEIGNANTS = { success: true, data: [{ id: 31, nom: 'Awa Fictive' }, { id: 32, nom: 'Issa Fictif' }] }
const LIGNE = `patch ${endpoints.catalogue.ligneProgramme(12, 5)}`
const RETIRER = `delete ${endpoints.catalogue.ligneProgramme(12, 5)}`

async function monterEdition(routes, choix = '5') {
  servir({ [`get ${endpoints.lms.enseignants}`]: [200, ENSEIGNANTS], ...routes })
  const w = mount(ProgrammeEdition, { props: { classeId: 12, programme: PROGRAMME } })
  await flushPromises()
  if (choix) await champ(w, 'choix').setValue(choix)
  return w
}

describe('#660 — modifier ou retirer une matière du programme', () => {
  it('le choix préremplit l’enseignant désigné et le coefficient de classe ; vide pour une ligne sans', async () => {
    const w = await monterEdition({})
    expect(champ(w, 'enseignant').element.value).toBe('31')
    expect(champ(w, 'coefficient').element.value).toBe('4')
    await champ(w, 'choix').setValue('6')
    expect(champ(w, 'enseignant').element.value).toBe('')
    expect(champ(w, 'coefficient').element.value).toBe('')
    expect(description(w, 'coefficient')).toContain('le coefficient de la matière (3)')
  })

  it('enregistrer envoie l’enseignant et le coefficient ; un coefficient vide part nul', async () => {
    const w = await monterEdition({ [LIGNE]: [200, { success: true, data: { classe_id: 12, matiere_id: 5, enseignant_id: 32, coefficient: null } }] })
    await champ(w, 'enseignant').setValue('32')
    await champ(w, 'coefficient').setValue('')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(ecritures()).toEqual([{ cle: LIGNE, corps: { enseignant_id: 32, coefficient: null } }])
    expect(w.find('[role="status"]').text()).toContain('Maths fictive')
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('un coefficient hors bornes est refusé SANS appel réseau', async () => {
    const w = await monterEdition({})
    await champ(w, 'coefficient').setValue('25')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(ecritures()).toEqual([])
    expect(description(w, 'coefficient')).toContain(ERROR_MESSAGES.programmeCoefficientIllisible)
  })

  it('retirer demande confirmation, puis envoie DELETE', async () => {
    confirmer.mockResolvedValue(true)
    const w = await monterEdition({ [RETIRER]: [200, { success: true, data: null, message: 'ok' }] })
    await w.findAll('button').find((b) => b.text() === 'Retirer de la classe').trigger('click')
    await flushPromises()
    expect(confirmer.mock.calls[0][0].variant).toBe('danger')
    expect(ecritures()).toEqual([{ cle: RETIRER, corps: undefined }])
    expect(w.emitted('fait')).toHaveLength(1)
  })

  it('sans confirmation, rien ne part', async () => {
    confirmer.mockResolvedValue(false)
    const w = await monterEdition({ [RETIRER]: [200, { success: true }] })
    await w.findAll('button').find((b) => b.text() === 'Retirer de la classe').trigger('click')
    await flushPromises()
    expect(ecritures()).toEqual([])
  })

  it('une matière employée dans la classe (409) : le motif du catalogue, jamais le texte du serveur', async () => {
    confirmer.mockResolvedValue(true)
    const w = await monterEdition({ [RETIRER]: [409, { success: false, message: 'Texte serveur, jamais affiché', reason: 'subject_in_use_in_class' }] })
    await w.findAll('button').find((b) => b.text() === 'Retirer de la classe').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.programmeMatiereEmployee)
    expect(w.emitted('fait')).toBeUndefined()
  })

  it('sans réponse : incertain, dit, et la fiche doit être relue', async () => {
    const w = await monterEdition({ [LIGNE]: [null] })
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.programmeModificationIncertaine)
    expect(w.emitted('incertaine')).toHaveLength(1)
  })
})

describe('#660 — l’onglet Matières de la fiche', () => {
  it('un coefficient propre à la classe est affiché, et celui de la matière qu’il remplace est dit', () => {
    const w = mount(ClasseMatieresTab, { props: { matieres: PROGRAMME } })
    const lignes = w.findAll('tbody tr')
    expect(lignes[0].text()).toContain('4')
    expect(lignes[0].text()).toContain('propre à la classe (matière : 2)')
    expect(lignes[1].text()).not.toContain('propre à la classe')
  })
})
