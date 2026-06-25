/**
 * Test du composable useCreateQuestions (H1 ≤300) : chargement de l'évaluation
 * KLASSCI, modes création/édition, gestion des questions et enregistrement.
 * Services klassci/evaluation + vue-router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  route: { query: {}, params: {} },
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  getEvaluations: vi.fn(),
  getTeacherDashboard: vi.fn(),
  getEvaluation: vi.fn(),
  createEvaluation: vi.fn(),
  publishEvaluation: vi.fn(),
  updateEvaluation: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.mockPush, back: h.mockBack })
}))
vi.mock('@/services/klassci', () => ({
  default: { getEvaluations: h.getEvaluations, getTeacherDashboard: h.getTeacherDashboard }
}))
vi.mock('@/services/evaluation', () => ({
  default: {
    getEvaluation: h.getEvaluation,
    createEvaluation: h.createEvaluation,
    publishEvaluation: h.publishEvaluation,
    updateEvaluation: h.updateEvaluation
  }
}))

import { useCreateQuestions } from '@/composables/useCreateQuestions'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useCreateQuestions(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useCreateQuestions (H1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('alert', vi.fn())
    h.route = { query: { klassci_id: '5' }, params: {} }
    h.getEvaluations.mockResolvedValue({
      success: true,
      data: [{ id: 5, titre: 'Éval T', matiere: { id: 1 }, classe: { id: 2 } }]
    })
    h.createEvaluation.mockResolvedValue({ success: true, data: { id: 99 } })
    h.publishEvaluation.mockResolvedValue({})
    h.updateEvaluation.mockResolvedValue({ success: true })
  })

  it('mode création : charge l\'évaluation KLASSCI, isEditMode=false', async () => {
    const c = await setup()
    expect(c.evaluationKlassci.value.id).toBe(5)
    expect(c.isEditMode.value).toBe(false)
  })

  it('gère les questions (add/remove/option/correct)', async () => {
    const c = await setup()
    c.addQuestion()
    expect(c.questions.value).toHaveLength(1)
    c.addOption(0)
    expect(c.questions.value[0].options).toHaveLength(5)
    c.removeOption(0, 0)
    expect(c.questions.value[0].options).toHaveLength(4)
    c.setCorrectAnswer(0, 'A')
    expect(c.questions.value[0].correct_answers).toEqual(['A'])
    c.toggleCorrectAnswer(0, 'A')
    expect(c.questions.value[0].correct_answers).toEqual([])
    c.removeQuestion(0)
    expect(c.questions.value).toHaveLength(0)
  })

  it('isValid exige durée > 0 et au moins une question', async () => {
    const c = await setup()
    expect(c.isValid.value).toBe(false)
    c.addQuestion()
    expect(c.isValid.value).toBe(true)
  })

  it('saveQuestions (création) crée + publie + redirige', async () => {
    const c = await setup()
    c.addQuestion()
    c.questions.value[0].question = 'Q1'
    c.questions.value[0].options = ['A', 'B', '']
    c.setCorrectAnswer(0, 'A')
    await c.saveQuestions()
    expect(h.createEvaluation).toHaveBeenCalledTimes(1)
    const payload = h.createEvaluation.mock.calls[0][0]
    expect(payload.status).toBe('planifiee')
    expect(payload.klassci_evaluation_id).toBe(5)
    expect(payload.questions[0].options).toEqual(['A', 'B'])
    expect(h.publishEvaluation).toHaveBeenCalledWith(99)
    expect(h.mockPush).toHaveBeenCalledWith('/teacher/evaluations')
  })

  it('mode édition : charge la config + les questions existantes et met à jour', async () => {
    h.route = { query: { klassci_id: '5' }, params: { id: '42' } }
    h.getEvaluation.mockResolvedValue({
      success: true,
      data: {
        id: 42, duree_minutes: 30, max_attempts: 3,
        shuffle_questions: true, show_results: true,
        questions: [{ question: 'Existante', type: 'qcm', points: 2, options: ['A', 'B'], correct_answers: ['A'] }]
      }
    })
    const c = await setup()
    expect(c.isEditMode.value).toBe(true)
    expect(c.configuration.duree_minutes).toBe(30)
    expect(c.questions.value).toHaveLength(1)
    expect(c.questions.value[0].question).toBe('Existante')
    await c.saveQuestions()
    expect(h.updateEvaluation).toHaveBeenCalledTimes(1)
    expect(h.updateEvaluation.mock.calls[0][0]).toBe(42)
    expect(h.createEvaluation).not.toHaveBeenCalled()
  })
})
