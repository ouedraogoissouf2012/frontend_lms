/**
 * Test du composable useTakeEvaluation (H1 ≤300) : chargement de l'évaluation +
 * initialisation des réponses, progression, QCM multiple, formatage du temps,
 * annulation et soumission. Service evaluation + auth + vue-router +
 * alert/confirm/setInterval mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  getEvaluation: vi.fn(),
  submitEvaluation: vi.fn(),
  getTimeStatus: vi.fn(),
  getUser: vi.fn(),
  push: vi.fn(),
  confirm: vi.fn(() => Promise.resolve(true)), // confirm() natif -> useConfirm().confirm() async (F3)
  query: { submission_id: 'sub-1', practice: '0' }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '42' }, query: h.query }),
  useRouter: () => ({ push: h.push })
}))
vi.mock('@/services/evaluation', () => ({
  default: {
    getEvaluation: h.getEvaluation,
    submitEvaluation: h.submitEvaluation,
    getTimeStatus: h.getTimeStatus
  }
}))
vi.mock('@/services/api', () => ({
  auth: { getUser: h.getUser }
}))
vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({ confirm: h.confirm, accept: vi.fn(), cancel: vi.fn(), state: {} }),
}))

import { useTakeEvaluation } from '@/composables/useTakeEvaluation'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTakeEvaluation(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

const sampleEval = {
  id: 42,
  titre: 'T',
  duree_minutes: 30,
  questions: [
    { id: 'q1', type: 'qcm', points: 1, options: ['A', 'B'] },
    { id: 'q2', type: 'qcm_multiple', points: 2, options: ['X', 'Y'] }
  ]
}

describe('useTakeEvaluation (H1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    h.confirm.mockResolvedValue(true)
    h.query = { submission_id: 'sub-1', practice: '0' }
    h.getUser.mockReturnValue({ id: 1 })
    h.getEvaluation.mockResolvedValue({ success: true, data: JSON.parse(JSON.stringify(sampleEval)) })
    h.submitEvaluation.mockResolvedValue({ success: true, data: { note_sur_20: 18, score: 9 } })
    h.getTimeStatus.mockResolvedValue({ success: true, data: {} })
  })

  it('charge l\'évaluation et initialise les réponses selon le type', async () => {
    const c = await setup()
    expect(c.loading.value).toBe(false)
    expect(c.evaluation.value.id).toBe(42)
    expect(c.answers.value.q1).toBe('')
    expect(c.answers.value.q2).toEqual([])
    expect(c.timeRemaining.value).toBe(1800)
    vi.useRealTimers()
  })

  it('redirige vers /login si pas d\'utilisateur', async () => {
    h.getUser.mockReturnValue(null)
    await setup()
    expect(h.push).toHaveBeenCalledWith('/login')
    vi.useRealTimers()
  })

  it('met une erreur si submission_id manquant', async () => {
    h.query = { practice: '0' }
    const c = await setup()
    expect(c.error.value).toBe('ID de soumission manquant')
    expect(c.loading.value).toBe(false)
    vi.useRealTimers()
  })

  it('answeredCount et progressPercentage suivent les réponses', async () => {
    const c = await setup()
    expect(c.answeredCount.value).toBe(0)
    c.answers.value.q1 = 'A'
    expect(c.answeredCount.value).toBe(1)
    expect(c.progressPercentage.value).toBe(50)
    vi.useRealTimers()
  })

  it('toggleMultipleChoice ajoute puis retire une option', async () => {
    const c = await setup()
    c.toggleMultipleChoice('q2', 'X')
    expect(c.answers.value.q2).toEqual(['X'])
    expect(c.isOptionSelected('q2', 'X')).toBe(true)
    c.toggleMultipleChoice('q2', 'X')
    expect(c.answers.value.q2).toEqual([])
    vi.useRealTimers()
  })

  it('formatTime et formatTimeLeft formatent correctement', async () => {
    const c = await setup()
    expect(c.formatTime(125)).toBe('02:05')
    expect(c.formatTimeLeft(0)).toBe('0 min')
    expect(c.formatTimeLeft(45)).toBe('45 min')
    expect(c.formatTimeLeft(125)).toBe('2h 05min')
    vi.useRealTimers()
  })

  it('confirmCancel redirige si confirmé', async () => {
    const c = await setup()
    await c.confirmCancel() // désormais asynchrone (useConfirm)
    expect(h.push).toHaveBeenCalledWith('/student/evaluations-list')
    vi.useRealTimers()
  })

  it('submitEvaluation envoie le payload et expose les résultats', async () => {
    const c = await setup()
    c.answers.value.q1 = 'A'
    await c.submitEvaluation()
    expect(h.submitEvaluation).toHaveBeenCalledWith(42, 'sub-1', c.answers.value)
    expect(c.results.value).toEqual({ note_sur_20: 18, score: 9 })
    expect(c.showResultsModal.value).toBe(true)
    vi.useRealTimers()
  })
})
