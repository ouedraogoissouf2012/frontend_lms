/**
 * #654 : l'admin d'une école autonome crée ses matières et compose le programme de ses classes, à l'écran.
 *
 * Contrats lus sur lms (origin/lms a451be8d) :
 *   - `POST /matieres` (StoreMatiereRequest) : `libelle` exigé (191 au plus) ; `code` (50) et `description` (2000)
 *     facultatifs ; `coefficient` entier 1..20 et `credit` entier 1..60, 1 par défaut. 201 `{ id, libelle, code,
 *     coefficient, credit }`. Refus : 403 `catalogue_managed_by_klassci`, 409 `no_institution`, 422 par champ.
 *   - `POST /classes/{classe}/matieres` (LinkClasseMatiereRequest) : `matiere_id` exigé, `enseignant_id` facultatif.
 *     `syncWithoutDetaching` : rattacher DE NOUVEAU une matière remplace son enseignant. 201 `{ classe_id, matiere_id,
 *     enseignant_id }`. Refus : 404 SANS `reason` (classe, matière ou formateur introuvable), plus 403/409/422.
 * Ici le VRAI client HTTP : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { REASONS } from '@/services/refusalReasons'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import MatiereCreation from '@/components/admin/MatiereCreation.vue'
import ProgrammeRattachement from '@/components/classes/ProgrammeRattachement.vue'

let adaptateurOrigine
let requetes

/** Un adaptateur qui répond selon la méthode et l'URL : `routes['post /matieres'] = [statut, corps]`. */
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

const ecritures = () => requetes.filter((r) => r.cle.startsWith('post '))
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)
function description(w, nom) {
  const ids = (champ(w, nom).attributes('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  return ids.map((id) => w.find(`#${id}`)).filter((e) => e.exists()).map((e) => e.text()).join(' ')
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
})

afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

// ─────────────────────────────────────────────── « Nouvelle matière » ───────────────────────────────────────────────

const MATIERE_CREEE = { success: true, data: { id: 41, libelle: 'Physique fictive', code: null, coefficient: 3, credit: 2 } }

async function creerMatiere(valeurs) {
  const w = mount(MatiereCreation)
  for (const [nom, valeur] of Object.entries(valeurs)) await champ(w, nom).setValue(valeur)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

describe('#654 — « Nouvelle matière » (POST /matieres)', () => {
  it('coefficient et crédit sont préremplis à 1, le défaut du serveur', () => {
    const w = mount(MatiereCreation)
    expect([champ(w, 'coefficient').element.value, champ(w, 'credit').element.value]).toEqual(['1', '1'])
  })

  it.each([
    ['libelle', { libelle: '  ' }, ERROR_MESSAGES.matiereLibelleRequis],
    ['coefficient', { libelle: 'Physique', coefficient: '0' }, ERROR_MESSAGES.matiereCoefficientIllisible],
    ['coefficient', { libelle: 'Physique', coefficient: '21' }, ERROR_MESSAGES.matiereCoefficientIllisible],
    ['coefficient', { libelle: 'Physique', coefficient: '2.5' }, ERROR_MESSAGES.matiereCoefficientIllisible],
    ['credit', { libelle: 'Physique', credit: '61' }, ERROR_MESSAGES.matiereCreditIllisible],
  ])('%s fautif : le texte du catalogue sous le champ, aucune écriture', async (nom, valeurs, texte) => {
    servir({ [`post ${endpoints.catalogue.matieres}`]: [201, MATIERE_CREEE] })
    const w = await creerMatiere(valeurs)
    expect(ecritures()).toEqual([])
    expect(description(w, nom)).toContain(texte)
    expect(champ(w, nom).attributes('aria-invalid')).toBe('true')
  })

  it('201 : corps EXACT (code et description omis s’ils sont vides), annonce, saisie remise à zéro, `creee` émis', async () => {
    servir({ [`post ${endpoints.catalogue.matieres}`]: [201, MATIERE_CREEE] })
    const w = await creerMatiere({ libelle: ' Physique fictive ', coefficient: '3', credit: '2' })
    expect(ecritures()).toEqual([{ cle: 'post /matieres', corps: { libelle: 'Physique fictive', coefficient: 3, credit: 2 } }])
    expect(w.find('[role="status"]').text()).toContain('Physique fictive')
    expect([champ(w, 'libelle').element.value, champ(w, 'coefficient').element.value]).toEqual(['', '1'])
    expect(w.emitted('creee')).toEqual([[MATIERE_CREEE.data]])
  })

  it('code et description renseignés : envoyés', async () => {
    servir({ [`post ${endpoints.catalogue.matieres}`]: [201, MATIERE_CREEE] })
    await creerMatiere({ libelle: 'Physique', code: ' PHY ', description: 'Mécanique' })
    expect(ecritures()[0].corps).toEqual({ libelle: 'Physique', code: 'PHY', description: 'Mécanique', coefficient: 1, credit: 1 })
  })

  it('422 sur `libelle` : sous son champ, saisie gardée', async () => {
    servir({ [`post ${endpoints.catalogue.matieres}`]: [422, { success: false, errors: { libelle: ['Trop long.'] } }] })
    const w = await creerMatiere({ libelle: 'Physique' })
    expect(description(w, 'libelle')).toContain('Trop long.')
    expect(champ(w, 'libelle').element.value).toBe('Physique')
  })

  it('403 `catalogue_managed_by_klassci` : le texte du CATALOGUE, jamais celui du serveur ; rien n’est émis', async () => {
    servir({ [`post ${endpoints.catalogue.matieres}`]: [403, { success: false, message: 'Texte serveur', reason: 'catalogue_managed_by_klassci' }] })
    const w = await creerMatiere({ libelle: 'Physique' })
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES[REASONS.catalogue_managed_by_klassci.categorie])
    expect(w.find('[role="alert"]').text()).not.toContain('Texte serveur')
    expect(w.emitted('creee')).toBeUndefined()
  })

  it.each([[null], [500]])('sans réponse / %s : création INCERTAINE, dite, `incertaine` émis', async (statut) => {
    servir({ [`post ${endpoints.catalogue.matieres}`]: [statut, { success: false }] })
    const w = await creerMatiere({ libelle: 'Physique' })
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.matiereCreationIncertaine)
    expect(w.emitted('incertaine')).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────── « Programme » d'une classe ───────────────────────────────────────────────

const MATIERES = { success: true, data: { matieres: [{ id: 5, nom: 'Maths fictive' }, { id: 6, nom: 'SVT fictive' }] } }
const ENSEIGNANTS = { success: true, data: [{ id: 31, nom: 'Awa Fictive', name: 'Awa Fictive' }] }
const LECTURES = { [`get ${endpoints.admin.matieres}`]: [200, MATIERES], [`get ${endpoints.lms.enseignants}`]: [200, ENSEIGNANTS] }
const RATTACHER = `post ${endpoints.catalogue.programme(12)}`

async function monterProgramme(routes, programme = []) {
  servir({ ...LECTURES, ...routes })
  const w = mount(ProgrammeRattachement, { props: { classeId: 12, programme } })
  await flushPromises()
  return w
}

async function rattacher(w, { matiere, enseignant }) {
  if (matiere !== undefined) await champ(w, 'matiere').setValue(matiere)
  if (enseignant !== undefined) await champ(w, 'enseignant').setValue(enseignant)
  await w.find('form').trigger('submit')
  await flushPromises()
}

describe('#654 — « Rattacher une matière » (POST /classes/{classe}/matieres)', () => {
  it('les choix : les matières de l’école, et « Sans enseignant » puis les enseignants (ids locaux)', async () => {
    const w = await monterProgramme({})
    const options = (nom) => champ(w, nom).findAll('option').filter((o) => o.attributes('value') !== undefined && o.attributes('disabled') === undefined).map((o) => [o.attributes('value'), o.text()])
    expect(options('matiere')).toEqual([['5', 'Maths fictive'], ['6', 'SVT fictive']])
    expect(options('enseignant')).toEqual([['', 'Sans enseignant'], ['31', 'Awa Fictive']])
  })

  it('aucune matière choisie : le texte du catalogue sous le champ, aucune écriture', async () => {
    const w = await monterProgramme({ [RATTACHER]: [201, {}] })
    await rattacher(w, {})
    expect(ecritures()).toEqual([])
    expect(description(w, 'matiere')).toContain(ERROR_MESSAGES.programmeMatiereRequise)
  })

  it('201 : corps EXACT avec l’enseignant, l’annonce le nomme, `rattachee` émis', async () => {
    const w = await monterProgramme({ [RATTACHER]: [201, { success: true, data: { classe_id: 12, matiere_id: 5, enseignant_id: 31 } }] })
    await rattacher(w, { matiere: '5', enseignant: '31' })
    expect(ecritures()).toEqual([{ cle: 'post /classes/12/matieres', corps: { matiere_id: 5, enseignant_id: 31 } }])
    expect(w.find('[role="status"]').text()).toContain('Maths fictive')
    expect(w.find('[role="status"]').text()).toContain('Awa Fictive')
    expect(w.emitted('rattachee')).toHaveLength(1)
  })

  it('« Sans enseignant » : `enseignant_id` nul', async () => {
    const w = await monterProgramme({ [RATTACHER]: [201, { success: true, data: { classe_id: 12, matiere_id: 6, enseignant_id: null } }] })
    await rattacher(w, { matiere: '6', enseignant: '' })
    expect(ecritures()[0].corps).toEqual({ matiere_id: 6, enseignant_id: null })
  })

  it('une matière DÉJÀ au programme : l’annonce dit que son enseignant est remplacé (syncWithoutDetaching)', async () => {
    const w = await monterProgramme({ [RATTACHER]: [201, { success: true, data: { classe_id: 12, matiere_id: 5, enseignant_id: 31 } }] }, [{ id: 5, nom: 'Maths fictive' }])
    await rattacher(w, { matiere: '5', enseignant: '31' })
    expect(w.find('[role="status"]').text()).toMatch(/remplacé/)
  })

  it('404 sans motif : le texte du front (classe, matière ou enseignant introuvable)', async () => {
    const w = await monterProgramme({ [RATTACHER]: [404, { success: false, message: 'Formateur introuvable dans cet établissement.' }] })
    await rattacher(w, { matiere: '5', enseignant: '31' })
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.programmeIntrouvable)
    expect(w.emitted('rattachee')).toBeUndefined()
  })

  it('422 sur `matiere_id` : sous le champ de la matière', async () => {
    const w = await monterProgramme({ [RATTACHER]: [422, { success: false, errors: { matiere_id: ['Invalide.'] } }] })
    await rattacher(w, { matiere: '5' })
    expect(description(w, 'matiere')).toContain('Invalide.')
  })

  it('sans réponse : rattachement INCERTAIN, dit, `incertaine` émis', async () => {
    const w = await monterProgramme({ [RATTACHER]: [null, {}] })
    await rattacher(w, { matiere: '5' })
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.programmeRattachementIncertain)
    expect(w.emitted('incertaine')).toHaveLength(1)
  })

  it('les listes de choix en panne : c’est dit, et rien n’est rattaché', async () => {
    servir({ [`get ${endpoints.admin.matieres}`]: [500, { success: false }], [`get ${endpoints.lms.enseignants}`]: [200, ENSEIGNANTS] })
    const w = mount(ProgrammeRattachement, { props: { classeId: 12, programme: [] } })
    await flushPromises()
    expect(w.find('[role="alert"]').text().length).toBeGreaterThan(0)
    await rattacher(w, {})
    expect(ecritures()).toEqual([])
  })
})
