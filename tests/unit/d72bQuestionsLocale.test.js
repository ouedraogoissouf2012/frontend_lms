/**
 * D72-b, volet 3 : les questions d'une évaluation LOCALE se modifient. `CreateQuestions` exigeait
 * `klassci_id` même en mode édition (route `:id`) : une évaluation locale, sans id KLASSCI, rebondissait
 * toujours (« ID évaluation KLASSCI manquant »). L'aperçu (`goToEdit`) rebondissait de même, KLASSCI
 * compris. Règle d'origine : `klassci_id` ne part QUE si l'évaluation porte `klassci_evaluation_id`.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  route: { query: {}, params: {} },
  push: vi.fn(), back: vi.fn(),
  getEvaluations: vi.fn(), getTeacherDashboard: vi.fn(),
  getEvaluation: vi.fn(), updateEvaluation: vi.fn(), previewEvaluation: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))
vi.mock('vue-router', () => ({ useRoute: () => h.route, useRouter: () => ({ push: h.push, back: h.back }) }))
vi.mock('@/services/klassci', () => ({ default: { getEvaluations: h.getEvaluations, getTeacherDashboard: h.getTeacherDashboard } }))
vi.mock('@/services/evaluation', () => ({
  default: { getEvaluation: h.getEvaluation, updateEvaluation: h.updateEvaluation, previewEvaluation: h.previewEvaluation },
}))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: () => Promise.resolve(true) }) }))

import { useCreateQuestions } from '@/composables/useCreateQuestions'
import { useTeacherEvaluationActions } from '@/composables/useTeacherEvaluationActions'
import { usePreviewEvaluation } from '@/composables/usePreviewEvaluation'

const LOCALE = {
  id: 70, klassci_evaluation_id: null, classe_id: 9, matiere_id: 3, titre: 'Contrôle local', bareme: 20,
  matiere: { id: null, nom: 'Maths' }, classe: { id: null, nom: '6e A' }, duree_minutes: 45,
  questions: [{ question: 'Q1', type: 'qcm', points: 1, options: ['A', 'B'], correct_answers: ['A'] }],
}

async function monter(fabrique) {
  let api
  mount(defineComponent({ setup() { api = fabrique(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  h.getEvaluation.mockResolvedValue({ success: true, data: LOCALE })
  h.updateEvaluation.mockResolvedValue({ success: true })
})

describe('useCreateQuestions — une évaluation locale se modifie sans id KLASSCI', () => {
  it('mode édition sans klassci_id : charge l’évaluation LMS, aucun rebond, aucune lecture KLASSCI', async () => {
    h.route = { query: {}, params: { id: '70' } }
    const c = await monter(useCreateQuestions)
    expect(h.back).not.toHaveBeenCalled()
    expect(h.toast.error).not.toHaveBeenCalled()
    expect(h.getEvaluations).not.toHaveBeenCalled()
    expect(h.getEvaluation).toHaveBeenCalledWith('70')
    expect(c.isEditMode.value).toBe(true)
    expect(c.questions.value).toHaveLength(1)
    expect(c.evaluationAffichee.value).toMatchObject({ titre: 'Contrôle local' })
  })

  it('enregistrer : PUT sur l’évaluation locale, sans aucune clé klassci_*', async () => {
    h.route = { query: {}, params: { id: '70' } }
    const c = await monter(useCreateQuestions)
    await c.saveQuestions()
    expect(h.updateEvaluation).toHaveBeenCalledTimes(1)
    const [id, charge] = h.updateEvaluation.mock.calls[0]
    expect(id).toBe(70)
    expect(Object.keys(charge).some((k) => k.startsWith('klassci_'))).toBe(false)
  })

  it('création sans klassci_id ni :id : rebond inchangé (la création locale passe par la liste)', async () => {
    h.route = { query: {}, params: {} }
    await monter(useCreateQuestions)
    expect(h.back).toHaveBeenCalled()
  })
})

describe('les chemins vers l’édition n’envoient klassci_id que pour une évaluation KLASSCI', () => {
  const actions = () => useTeacherEvaluationActions({ evaluationsLMS: { value: [] }, loadEvaluationsLMS: vi.fn() })

  it('liste : carte locale → EditQuestions sans klassci_id ; carte KLASSCI → avec', async () => {
    const a = await monter(actions)
    a.editOnlineVersion({ id: 70, online_version: LOCALE })
    expect(h.push).toHaveBeenLastCalledWith({ name: 'EditQuestions', params: { id: 70 }, query: {} })
    a.editOnlineVersion({ id: 5, online_version: { id: 50, klassci_evaluation_id: 5 } })
    expect(h.push).toHaveBeenLastCalledWith({ name: 'EditQuestions', params: { id: 50 }, query: { klassci_id: 5 } })
  })

  it('aperçu : goToEdit garde l’id KLASSCI s’il existe, n’en invente pas sinon', async () => {
    h.route = { query: {}, params: { id: '70' } }
    h.previewEvaluation.mockResolvedValue({ success: true, data: LOCALE })
    const locale = await monter(usePreviewEvaluation)
    locale.goToEdit()
    expect(h.push).toHaveBeenLastCalledWith({ name: 'EditQuestions', params: { id: 70 }, query: {} })
    h.previewEvaluation.mockResolvedValue({ success: true, data: { id: 50, klassci_evaluation_id: 5 } })
    const klassci = await monter(usePreviewEvaluation)
    klassci.goToEdit()
    expect(h.push).toHaveBeenLastCalledWith({ name: 'EditQuestions', params: { id: 50 }, query: { klassci_id: 5 } })
  })
})
