/**
 * #657 (lms_backend#1208) : une classe d'école autonome se rattache à sa période, à l'écran.
 *
 * Contrat : `PUT /classes/{classe}/periode`, corps `{ training_session_id: id | null }` EXIGÉ, réponse
 * `data: { id, training_session_id }`. `GET /classes` rend `training_session_id`. Le serveur refuse en
 * 422 une période qui ne reçoit plus d'inscriptions (annulée, clôturée, archivée) ; en école KLASSCI,
 * 403 `catalogue_managed_by_klassci`. L'écran est gardé par `peutInscrireLocalement`.
 *
 * Les périodes proposées (brouillon ou publiées) sont chargées UNE fois par l'écran, toutes pages. Après
 * le PUT, l'écran dit la période RELUE du serveur, pas le choix.
 *
 * Ici le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { libellePeriode, usePeriodesRecevables } from '@/composables/usePeriodesRecevables'
import { useEnrolmentCodes } from '@/composables/useEnrolmentCodes'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import ClassePeriode from '@/components/admin/ClassePeriode.vue'
import EnrolmentCodeCard from '@/components/admin/EnrolmentCodeCard.vue'

let adaptateurOrigine
let requetes

/** Une réponse par requête, dans l'ordre ; `status: null` : aucune réponse (délai, réseau). */
function repondre(...reponses) {
  api.defaults.adapter = async (config) => {
    requetes.push({ method: config.method, url: config.url, params: config.params, corps: config.data === undefined ? undefined : JSON.parse(config.data) })
    const [status, data] = reponses.length > 1 ? reponses.shift() : reponses[0]
    if (status === null) throw new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED, config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

const classe = (extra = {}) => ({ id: 7, libelle: '6e A fictive', code: 'F6A', effectif: 30, training_session_id: null, code_inscription: { etat: 'absent', valeur: null }, ...extra })
const PERIODES = [
  { id: 11, libelle: 'Session de janvier', status: 'publiee' },
  { id: 12, libelle: 'Session de mars', status: 'brouillon' },
]

async function choisir(valeur, cl = classe(), periodes = PERIODES) {
  const w = mount(ClassePeriode, { props: { classe: cl, periodes } })
  await w.find('button.periode-modifier').trigger('click')
  await w.find('select.periode-choix').setValue(valeur)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#657 — le chemin et le service', () => {
  it('enrolment.periode(id) → /classes/{id}/periode (spec du back, sans préfixe /lms)', () => {
    expect(endpoints.enrolment.periode(7)).toBe('/classes/7/periode')
  })

  it('rattacherPeriode envoie PUT { training_session_id } et rend la réponse', async () => {
    repondre([200, { success: true, data: { id: 7, training_session_id: 11 } }])
    const response = await enrolmentCodesService.rattacherPeriode(7, 11)
    expect(requetes).toEqual([{ method: 'put', url: '/classes/7/periode', params: undefined, corps: { training_session_id: 11 } }])
    expect(response.data.training_session_id).toBe(11)
  })
})

describe('#657 — les périodes proposées', () => {
  it('garde le brouillon et la publiée, écarte celles qui ne reçoivent plus, sur TOUTES les pages', async () => {
    repondre(
      [200, { success: true, data: [PERIODES[0], { id: 13, libelle: 'Close', status: 'cloturee' }], meta: { current_page: 1, last_page: 2 } }],
      [200, { success: true, data: [PERIODES[1], { id: 14, libelle: 'Annulée', status: 'annulee' }], meta: { current_page: 2, last_page: 2 } }],
    )
    const { periodes, erreur, charger } = usePeriodesRecevables()
    await charger()
    expect(periodes.value.map((p) => p.id)).toEqual([11, 12])
    expect(erreur.value).toBe(false)
    expect(requetes.map((r) => r.params.page)).toEqual([1, 2])
  })

  it('une liste illisible se dit, et ne propose rien', async () => {
    repondre([500, { success: false }])
    const { periodes, erreur, charger } = usePeriodesRecevables()
    await charger()
    expect(periodes.value).toEqual([])
    expect(erreur.value).toBe(true)
  })

  it('le libellé : aucune, la période nommée, une période hors liste, une clé absente', () => {
    expect(libellePeriode(classe(), PERIODES)).toBe('Période : aucune')
    expect(libellePeriode(classe({ training_session_id: 11 }), PERIODES)).toBe('Période : Session de janvier')
    expect(libellePeriode(classe({ training_session_id: 99 }), PERIODES)).toBe('Période : close ou archivée')
    const sansCle = classe()
    delete sansCle.training_session_id
    expect(libellePeriode(sansCle, PERIODES)).toBe('Période : non communiquée')
  })
})

describe('#657 — choisir la période à l’écran', () => {
  it('le choix part au serveur, et la carte émet la période RELUE', async () => {
    repondre([200, { success: true, data: { id: 7, training_session_id: 12 } }])
    const w = await choisir('12')
    expect(requetes.at(-1).corps).toEqual({ training_session_id: 12 })
    expect(w.emitted('rattachee')).toEqual([[12]])
    expect(w.find('form').exists()).toBe(false)
  })

  it('c’est la période RELUE qui fait foi, même si elle diffère du choix', async () => {
    // Le serveur décide : la carte émet ce qu'il a enregistré, jamais ce qui a été choisi.
    repondre([200, { success: true, data: { id: 7, training_session_id: 11 } }])
    const w = await choisir('12')
    expect(requetes.at(-1).corps).toEqual({ training_session_id: 12 })
    expect(w.emitted('rattachee')).toEqual([[11]])
  })

  it('« Aucune période » détache la classe (null)', async () => {
    repondre([200, { success: true, data: { id: 7, training_session_id: null } }])
    const w = await choisir('', classe({ training_session_id: 11 }))
    expect(requetes.at(-1).corps).toEqual({ training_session_id: null })
    expect(w.emitted('rattachee')).toEqual([[null]])
  })

  it('le brouillon est étiqueté comme tel dans le choix', async () => {
    const w = mount(ClassePeriode, { props: { classe: classe(), periodes: PERIODES } })
    await w.find('button.periode-modifier').trigger('click')
    const options = w.findAll('option').map((o) => o.text())
    expect(options).toEqual(['Aucune période', 'Session de janvier', 'Session de mars (brouillon)'])
  })

  it('un refus 422 dit le motif du champ, ne change rien et garde le formulaire', async () => {
    repondre([422, { success: false, message: 'Données invalides', errors: { training_session_id: ['Cette période ne reçoit plus de classe.'] } }])
    const w = await choisir('11')
    expect(w.emitted('rattachee')).toBeUndefined()
    expect(w.find('form').exists()).toBe(true)
    expect(w.find('[role="alert"]').text()).toContain('Cette période ne reçoit plus de classe.')
    expect(w.find('.periode-valeur').text()).toBe('Période : aucune')
  })

  it('sans réponse, la période affichée devient incertaine', async () => {
    repondre([null])
    const w = await choisir('11')
    expect(w.emitted('rattachee')).toBeUndefined()
    expect(w.find('.periode-valeur').text()).toBe(ERROR_MESSAGES.periodeIncertaine)
  })

  it('un succès sans période relisible n’est pas un succès', async () => {
    repondre([200, { success: true, data: { id: 7 } }])
    const w = await choisir('11')
    expect(w.emitted('rattachee')).toBeUndefined()
    expect(w.find('.periode-valeur').text()).toBe(ERROR_MESSAGES.periodeIncertaine)
  })
})

describe('#657 — la carte et la liste', () => {
  it('la carte relaie la période relue en `periode`', async () => {
    repondre([200, { success: true, data: { id: 7, training_session_id: 11 } }])
    const w = mount(EnrolmentCodeCard, { props: { classe: classe(), periodes: PERIODES } })
    await w.find('button.periode-modifier').trigger('click')
    await w.find('select.periode-choix').setValue('11')
    await w.find('.periode-form').trigger('submit')
    await flushPromises()
    expect(w.emitted('periode')).toEqual([[11]])
  })

  it('la liste garde la période relue pour cette classe seulement', () => {
    const { classes, majPeriode } = useEnrolmentCodes()
    classes.value = [classe({ id: 7 }), classe({ id: 8, training_session_id: 11 })]
    majPeriode(7, 12)
    expect(classes.value.map((c) => c.training_session_id)).toEqual([12, 11])
  })
})
