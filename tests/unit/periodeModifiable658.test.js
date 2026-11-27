/**
 * #658 (lms_backend#1651) : une période se modifie, un brouillon se supprime, et UNE période est « en cours ».
 *
 * Contrat : `PUT /training-sessions/{id}` (libellé et cinq dates, chaque date présente, nulle comprise),
 * `DELETE /training-sessions/{id}` (brouillon sans classe), `POST /training-sessions/{id}/en-cours`
 * (une période publiée). Refus nommés : `training_session_not_editable`, `..._published_needs_start`,
 * `..._not_deletable`, `..._not_publiee`. La vue de période porte `en_cours` (booléen).
 *
 * Ici le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { trainingSessionsService } from '@/services/trainingSessions'
import { useAdminTrainingSessions } from '@/composables/useAdminTrainingSessions'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import PeriodeModification from '@/components/admin/PeriodeModification.vue'
import TrainingPeriodCard from '@/components/admin/TrainingPeriodCard.vue'

const confirmer = vi.fn()
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmer(...a) }) }))

let adaptateurOrigine
let requetes

/** Une réponse par requête, dans l'ordre ; `status: null` : aucune réponse (délai, réseau). */
function repondre(...reponses) {
  api.defaults.adapter = async (config) => {
    requetes.push({ method: config.method, url: config.url, corps: config.data === undefined ? undefined : JSON.parse(config.data) })
    const [status, data] = reponses.length > 1 ? reponses.shift() : reponses[0]
    if (status === null) throw new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED, config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

const periode = (extra = {}) => ({
  id: 5, libelle: 'Session de janvier', status: 'brouillon', phase: 'a_venir', en_cours: false,
  program_id: 1, program: { id: 1, titre: 'Bureautique' },
  enrollment_opens_at: null, enrollment_closes_at: null, starts_on: '2027-01-04', ends_on: '2027-03-26', certificate_available_at: null,
  ...extra,
})

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  confirmer.mockReset()
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#658 — les chemins et le service', () => {
  it('les chemins de la spec, sans préfixe /lms', () => {
    expect(endpoints.trainingSessionEdition.periode(5)).toBe('/training-sessions/5')
    expect(endpoints.trainingSessionEdition.enCours(5)).toBe('/training-sessions/5/en-cours')
  })

  it('modifier envoie PUT avec le libellé et les CINQ dates, une date vide partant null', async () => {
    repondre([200, { success: true, data: periode() }])
    await trainingSessionsService.modifier(5, { libelle: 'Session', enrollment_opens_at: '', starts_on: '2027-01-04', ends_on: '2027-03-26' })
    expect(requetes).toEqual([{ method: 'put', url: '/training-sessions/5', corps: {
      libelle: 'Session', enrollment_opens_at: null, enrollment_closes_at: null,
      starts_on: '2027-01-04', ends_on: '2027-03-26', certificate_available_at: null,
    } }])
  })

  it('supprimer envoie DELETE, designerEnCours envoie POST sans corps', async () => {
    repondre([200, { success: true, data: null }], [200, { success: true, data: periode({ status: 'publiee', en_cours: true }) }])
    await trainingSessionsService.supprimer(5)
    await trainingSessionsService.designerEnCours(5)
    expect(requetes.map((r) => `${r.method} ${r.url}`)).toEqual(['delete /training-sessions/5', 'post /training-sessions/5/en-cours'])
  })
})

describe('#658 — modifier une période sur sa carte', () => {
  async function ouvrir(p = periode()) {
    const w = mount(PeriodeModification, { props: { periode: p } })
    await w.find('button.modif-ouvrir').trigger('click')
    return w
  }

  it('le formulaire part des valeurs de la période, et émet la période RELUE', async () => {
    const w = await ouvrir()
    expect(w.find('input[type="text"]').element.value).toBe('Session de janvier')
    await w.find('input[type="text"]').setValue('Session renommée')
    repondre([200, { success: true, data: periode({ libelle: 'Session renommée (relue)' }) }])
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(requetes.at(-1).corps.libelle).toBe('Session renommée')
    expect(w.emitted('modifiee')[0][0].libelle).toBe('Session renommée (relue)')
    expect(w.find('form').exists()).toBe(false)
  })

  it('un 422 par champ s’affiche sous le champ, relié par aria-describedby', async () => {
    const w = await ouvrir()
    repondre([422, { success: false, message: 'Données invalides', errors: { ends_on: ['La fin doit suivre le début.'] } }])
    await w.find('form').trigger('submit')
    await flushPromises()
    const fin = w.findAll('input[type="date"]')[3]
    expect(fin.attributes('aria-invalid')).toBe('true')
    expect(w.find(`#${fin.attributes('aria-describedby')}`).text()).toBe('La fin doit suivre le début.')
    expect(w.emitted('modifiee')).toBeUndefined()
  })

  it('une période close refusée (409) dit le motif du catalogue, jamais le texte du serveur', async () => {
    const w = await ouvrir()
    repondre([409, { success: false, message: 'Texte serveur, jamais affiché', reason: 'training_session_not_editable' }])
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.periodeNonModifiable)
  })

  it('sans réponse, la période affichée devient incertaine', async () => {
    const w = await ouvrir()
    repondre([null])
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.text()).toContain(ERROR_MESSAGES.periodeIncertaine)
  })
})

describe('#658 — la carte', () => {
  it('le badge « Période en cours » et ses gestes selon l’état', () => {
    const enCours = mount(TrainingPeriodCard, { props: { periode: periode({ status: 'publiee', en_cours: true }) } })
    expect(enCours.find('.period-en-cours').text()).toBe('Période en cours')
    expect(enCours.text()).not.toContain('Définir comme période en cours')
    expect(enCours.text()).not.toContain('Supprimer le brouillon')
    expect(enCours.find('button.modif-ouvrir').exists()).toBe(true)

    const publiee = mount(TrainingPeriodCard, { props: { periode: periode({ status: 'publiee' }) } })
    expect(publiee.find('.period-en-cours').exists()).toBe(false)
    expect(publiee.text()).toContain('Définir comme période en cours')

    const brouillon = mount(TrainingPeriodCard, { props: { periode: periode() } })
    expect(brouillon.text()).toContain('Supprimer le brouillon')
    expect(brouillon.text()).not.toContain('Définir comme période en cours')

    const close = mount(TrainingPeriodCard, { props: { periode: periode({ status: 'cloturee' }) } })
    expect(close.find('button.modif-ouvrir').exists()).toBe(false)
    expect(close.text()).not.toContain('Supprimer le brouillon')
  })
})

describe('#658 — les gestes de la liste', () => {
  it('supprimer demande confirmation, puis retire le brouillon de la liste', async () => {
    const { periodes, supprimer, notice } = useAdminTrainingSessions()
    periodes.value = [periode(), periode({ id: 6, libelle: 'Autre' })]
    confirmer.mockResolvedValue(true)
    repondre([200, { success: true, data: null }])
    expect(await supprimer(periodes.value[0])).toBe(true)
    expect(periodes.value.map((p) => p.id)).toEqual([6])
    expect(notice.value).toBe('Brouillon supprimé.')
  })

  it('sans confirmation, rien ne part', async () => {
    const { periodes, supprimer } = useAdminTrainingSessions()
    periodes.value = [periode()]
    confirmer.mockResolvedValue(false)
    repondre([200, { success: true, data: null }])
    expect(await supprimer(periodes.value[0])).toBe(false)
    expect(requetes).toEqual([])
  })

  it('un brouillon avec une classe : le motif du catalogue, la liste intacte', async () => {
    const { periodes, supprimer, error } = useAdminTrainingSessions()
    periodes.value = [periode()]
    confirmer.mockResolvedValue(true)
    repondre([409, { success: false, message: 'x', reason: 'training_session_not_deletable' }])
    await supprimer(periodes.value[0])
    expect(error.value).toBe(ERROR_MESSAGES.periodeNonSupprimable)
    expect(periodes.value).toHaveLength(1)
  })

  it('désigner la période en cours RELIT la liste : la marque a quitté l’ancienne', async () => {
    const { periodes, designerEnCours } = useAdminTrainingSessions()
    periodes.value = [periode({ id: 5, status: 'publiee', en_cours: true }), periode({ id: 6, status: 'publiee' })]
    repondre(
      [200, { success: true, data: periode({ id: 6, status: 'publiee', en_cours: true }) }],
      [200, { success: true, data: [periode({ id: 6, status: 'publiee', en_cours: true }), periode({ id: 5, status: 'publiee' })], meta: { current_page: 1, last_page: 1 } }],
    )
    expect(await designerEnCours(periodes.value[1])).toBe(true)
    expect(requetes.map((r) => `${r.method} ${r.url}`)).toEqual(['post /training-sessions/6/en-cours', 'get /training-sessions'])
    expect(periodes.value.map((p) => [p.id, p.en_cours])).toEqual([[6, true], [5, false]])
  })

  it('clôturer la période en cours retire le badge : le serveur a libéré la marque', async () => {
    const { periodes, transitionner } = useAdminTrainingSessions()
    periodes.value = [periode({ status: 'publiee', en_cours: true })]
    repondre([200, { success: true, data: { id: 5, libelle: 'Session de janvier', status: 'cloturee', phase: 'a_venir' } }])
    await transitionner(periodes.value[0], 'cloturer')
    expect(periodes.value[0].en_cours).toBe(false)
  })
})
