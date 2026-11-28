/**
 * #659 (lms_backend#1652) : modifier, archiver une classe locale, et transférer un élève, à l'écran.
 *
 * Contrat : `PATCH /classes/{c}` (libellé, code, description ; un code ou une description vide part nul ; réponse
 * ClasseEnVue), `POST /classes/{c}/archiver|desarchiver` (réponse : la LIGNE de la collection), `GET /classes`
 * filtrée par `statut` et `places`, `POST /classes/{c}/eleves/{e}/muter` `{classe_id}`. Refus nommés :
 * `class_code_already_used` (422, sous le code), `class_archived`, `class_period_closed`, `already_in_class`,
 * `class_full`, `enrolment_not_active` (409).
 *
 * Le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { messageForReason } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useEnrolmentCodes } from '@/composables/useEnrolmentCodes'
import ClasseGestes from '@/components/admin/ClasseGestes.vue'
import ClassesLocalesFiltres from '@/components/admin/ClassesLocalesFiltres.vue'
import EnrolmentCodeCard from '@/components/admin/EnrolmentCodeCard.vue'
import TransfertDEleve from '@/components/classes/TransfertDEleve.vue'

const confirmer = vi.fn()
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmer(...a) }) }))

let adaptateurOrigine
let requetes

/** Un adaptateur qui répond selon la méthode et l'URL (paramètres compris) ; `[null]` : aucune réponse. */
function servir(routes) {
  api.defaults.adapter = async (config) => {
    const query = new URLSearchParams(config.params ?? {}).toString()
    const cle = `${config.method} ${config.url}${query ? `?${query}` : ''}`
    requetes.push({ cle, corps: config.data === undefined ? undefined : JSON.parse(config.data) })
    const [status, data] = routes[cle] ?? routes[`${config.method} ${config.url}`] ?? [599, { success: false }]
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
const bouton = (w, texte) => w.findAll('button').find((b) => b.text().trim() === texte)

const LIGNE = Object.freeze({
  id: 7, libelle: '6e A', code: null, description: 'Section bilingue', training_session_id: null, effectif: null,
  code_inscription: { etat: 'actif', valeur: 'BUR7K2' }, archivee_le: null,
})
const page = (lignes) => [200, { success: true, data: lignes, meta: { current_page: 1, last_page: 1 } }]

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  confirmer.mockReset()
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#659 — les chemins', () => {
  it('ceux de la spec, sans préfixe /lms', () => {
    expect(endpoints.enrolment.classe(7)).toBe('/classes/7')
    expect(endpoints.enrolment.archiver(7)).toBe('/classes/7/archiver')
    expect(endpoints.enrolment.desarchiver(7)).toBe('/classes/7/desarchiver')
    expect(endpoints.enrolment.muter(3, 9)).toBe('/classes/3/eleves/9/muter')
  })
})

describe('#659 — les filtres de la liste', () => {
  it('« actives » par défaut ; un filtre change la requête et ramène à la page 1', async () => {
    servir({ 'get /classes': page([LIGNE]) })
    const liste = useEnrolmentCodes()
    await liste.load(3)
    expect(requetes.at(-1).cle).toBe('get /classes?page=3&per_page=25&statut=active')

    liste.filtres.places = 'pleine'
    await liste.filtrer()
    expect(requetes.at(-1).cle).toBe('get /classes?page=1&per_page=25&statut=active&places=pleine')

    liste.filtres.statut = ''
    liste.filtres.places = ''
    await liste.filtrer()
    expect(requetes.at(-1).cle).toBe('get /classes?page=1&per_page=25')
  })

  it('les sélecteurs portent un libellé et émettent le choix', async () => {
    const w = mount(ClassesLocalesFiltres, { props: { statut: 'active', places: '' } })
    expect(w.find('label[for]').exists()).toBe(true)
    await champ(w, 'statut').setValue('archivee')
    expect(w.emitted('update:statut')?.at(-1)).toEqual(['archivee'])
  })

  it('une classe archivée sort d’une liste filtrée sur les actives ; elle reste dans « toutes »', () => {
    const liste = useEnrolmentCodes()
    liste.classes.value = [LIGNE]
    liste.majLigne({ ...LIGNE, archivee_le: '2026-11-27T10:00:00+00:00' })
    expect(liste.classes.value).toEqual([])

    liste.filtres.statut = ''
    liste.classes.value = [LIGNE]
    liste.majLigne({ ...LIGNE, archivee_le: '2026-11-27T10:00:00+00:00' })
    expect(liste.classes.value[0].archivee_le).toBe('2026-11-27T10:00:00+00:00')
  })
})

describe('#659 — modifier une classe (PATCH /classes/{classe})', () => {
  it('le formulaire part de la ligne : un code nul reste vide, la description est reprise', async () => {
    const w = mount(ClasseGestes, { props: { classe: LIGNE } })
    await bouton(w, 'Modifier la classe').trigger('click')
    expect(champ(w, 'libelle').element.value).toBe('6e A')
    expect(champ(w, 'code').element.value).toBe('')
    expect(champ(w, 'description').element.value).toBe('Section bilingue')
  })

  it('envoie les trois champs, un code vide nul, et émet la ligne mise à jour', async () => {
    servir({ 'patch /classes/7': [200, { success: true, data: { id: 7, libelle: '6e A bis', code: null, description: 'Section bilingue', effectif: null } }] })
    const w = mount(ClasseGestes, { props: { classe: LIGNE } })
    await bouton(w, 'Modifier la classe').trigger('click')
    await champ(w, 'libelle').setValue('6e A bis')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(ecritures()).toEqual([{ cle: 'patch /classes/7', corps: { libelle: '6e A bis', code: null, description: 'Section bilingue' } }])
    expect(w.emitted('ligne')?.at(-1)?.[0]).toMatchObject({ id: 7, libelle: '6e A bis', code_inscription: LIGNE.code_inscription })
  })

  it('un code déjà employé dans l’école : le motif du catalogue, SOUS le champ code', async () => {
    servir({ 'patch /classes/7': [422, { success: false, message: 'Le code est déjà pris.', reason: 'class_code_already_used', errors: { code: ['Le code est déjà pris.'] } }] })
    const w = mount(ClasseGestes, { props: { classe: LIGNE } })
    await bouton(w, 'Modifier la classe').trigger('click')
    await champ(w, 'code').setValue('6B')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(description(w, 'code')).toContain(ERROR_MESSAGES.classeCodeDejaEmploye)
    expect(w.emitted('ligne')).toBeUndefined()
  })

  it('un libellé vide est refusé SANS appel réseau', async () => {
    servir({})
    const w = mount(ClasseGestes, { props: { classe: LIGNE } })
    await bouton(w, 'Modifier la classe').trigger('click')
    await champ(w, 'libelle').setValue('  ')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(ecritures()).toEqual([])
    expect(description(w, 'libelle')).toContain(ERROR_MESSAGES.classeLibelleRequis)
  })
})

describe('#659 — archiver, désarchiver', () => {
  it('archiver demande confirmation, envoie POST, et émet la ligne rendue', async () => {
    const archivee = { ...LIGNE, archivee_le: '2026-11-27T10:00:00+00:00', code_inscription: { etat: 'retire', valeur: null } }
    servir({ 'post /classes/7/archiver': [200, { success: true, message: 'Classe archivée.', data: archivee }] })
    confirmer.mockResolvedValue(true)
    const w = mount(ClasseGestes, { props: { classe: LIGNE } })
    await bouton(w, 'Archiver').trigger('click')
    await flushPromises()
    expect(confirmer).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' }))
    expect(ecritures().map((r) => r.cle)).toEqual(['post /classes/7/archiver'])
    expect(w.emitted('ligne')?.at(-1)?.[0]).toEqual(archivee)
  })

  it('sans confirmation, rien ne part', async () => {
    servir({})
    confirmer.mockResolvedValue(false)
    const w = mount(ClasseGestes, { props: { classe: LIGNE } })
    await bouton(w, 'Archiver').trigger('click')
    await flushPromises()
    expect(ecritures()).toEqual([])
  })

  it('une classe archivée offre « Désarchiver », et la carte n’émet plus de code', async () => {
    const archivee = { ...LIGNE, archivee_le: '2026-11-27T10:00:00+00:00', code_inscription: { etat: 'retire', valeur: null } }
    servir({ 'post /classes/7/desarchiver': [200, { success: true, data: { ...archivee, archivee_le: null } }] })
    confirmer.mockResolvedValue(true)
    const gestes = mount(ClasseGestes, { props: { classe: archivee } })
    expect(bouton(gestes, 'Archiver')).toBeUndefined()
    await bouton(gestes, 'Désarchiver').trigger('click')
    await flushPromises()
    expect(ecritures().map((r) => r.cle)).toEqual(['post /classes/7/desarchiver'])

    const carte = mount(EnrolmentCodeCard, { props: { classe: archivee }, global: { stubs: ['router-link', 'ClasseCapacite', 'ClassePeriode', 'ClasseGestes'] } })
    expect(carte.text()).toContain('Archivée')
    expect(bouton(carte, 'Émettre un code')).toBeUndefined()
  })
})

describe('#659 — transférer un élève (POST /classes/{c}/eleves/{e}/muter)', () => {
  const ETUDIANTS = [{ id: 9, name: 'Awa Kaboré' }, { id: 10, name: 'Issa Ouédraogo' }]
  const CLASSES = page([{ ...LIGNE, id: 3, libelle: '6e A' }, { ...LIGNE, id: 4, libelle: '6e B' }, { ...LIGNE, id: 5, libelle: '6e C' }])

  async function monter(routes) {
    servir({ 'get /classes?statut=active&per_page=100': CLASSES, ...routes })
    const w = mount(TransfertDEleve, { props: { classeId: 3, etudiants: ETUDIANTS } })
    await flushPromises()
    return w
  }

  it('propose les classes ACTIVES de l’école, hors la classe courante', async () => {
    const w = await monter({})
    const options = champ(w, 'cible').findAll('option').map((o) => o.text()).filter((t) => t.startsWith('6e'))
    expect(options).toEqual(['6e B', '6e C'])
  })

  it('confirme, envoie classe_id, puis émet `transfere`', async () => {
    const w = await monter({ 'post /classes/3/eleves/9/muter': [200, { success: true, data: { eleve_id: 9, depuis: 3, vers: 4 } }] })
    confirmer.mockResolvedValue(true)
    await champ(w, 'eleve').setValue('9')
    await champ(w, 'cible').setValue('4')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(ecritures()).toEqual([{ cle: 'post /classes/3/eleves/9/muter', corps: { classe_id: 4 } }])
    expect(w.emitted('transfere')).toHaveLength(1)
  })

  it('sans confirmation, rien ne part ; sans choix, rien ne part non plus', async () => {
    const w = await monter({})
    confirmer.mockResolvedValue(false)
    await w.find('form').trigger('submit')
    await champ(w, 'eleve').setValue('9')
    await champ(w, 'cible').setValue('4')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(ecritures()).toEqual([])
  })

  it.each([
    ['class_full', 'transfertClasseComplete'],
    ['class_archived', 'classeArchivee'],
    ['class_period_closed', 'classePeriodeClose'],
    ['already_in_class', 'eleveDejaDansLaClasse'],
    ['enrolment_not_active', 'transfertInscriptionNonActive'],
  ])('un refus %s : le message de la gestion, jamais le texte du serveur', async (reason, cle) => {
    const w = await monter({ 'post /classes/3/eleves/9/muter': [409, { success: false, message: 'texte serveur', reason }] })
    confirmer.mockResolvedValue(true)
    await champ(w, 'eleve').setValue('9')
    await champ(w, 'cible').setValue('4')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(ERROR_MESSAGES[cle]).toBeTruthy()
    expect(w.text()).toContain(ERROR_MESSAGES[cle])
    expect(w.text()).not.toContain('texte serveur')
    expect(w.emitted('transfere')).toBeUndefined()
  })
})

describe('#659 — le catalogue des motifs', () => {
  it.each([
    ['class_archived', 'classeArchivee'],
    ['class_period_closed', 'classePeriodeClose'],
    ['already_in_class', 'eleveDejaDansLaClasse'],
    ['teacher_out_of_scope', 'enseignantHorsEtablissement'],
  ])('%s a son message', (reason, cle) => {
    expect(ERROR_MESSAGES[cle]).toBeTruthy()
    expect(messageForReason(reason)).toBe(ERROR_MESSAGES[cle])
  })
})
