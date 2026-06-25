/**
 * Test du composable useStudentEvaluations (H2 ≤300) : chargement des évaluations
 * de l'étudiant connecté, gestion d'erreur, et navigation (start/continue/retake).
 * Services evaluation/api + vue-router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

const getUser = vi.fn(() => ({ klassci_id: 42 }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => getUser() } }))

const getStudentEvaluations = vi.fn()
const startEvaluation = vi.fn()
vi.mock('@/services/evaluation', () => ({
  default: {
    getStudentEvaluations: () => getStudentEvaluations(),
    startEvaluation: (...args) => startEvaluation(...args),
  },
}))

import { useStudentEvaluations } from '@/composables/useStudentEvaluations'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useStudentEvaluations(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => {
  push.mockClear()
  startEvaluation.mockReset()
  getStudentEvaluations.mockReset()
  getUser.mockReturnValue({ klassci_id: 42 })
})

describe('useStudentEvaluations (H2)', () => {
  it('charge les évaluations de l\'étudiant connecté au montage', async () => {
    getStudentEvaluations.mockResolvedValue({ success: true, data: [{ id: 1, titre: 'Éval 1' }] })
    const u = await setup()
    expect(u.evaluations.value).toHaveLength(1)
    expect(u.loading.value).toBe(false)
    expect(u.error.value).toBe(null)
  })

  it('redirige vers /login si aucun utilisateur', async () => {
    getUser.mockReturnValue(null)
    await setup()
    expect(push).toHaveBeenCalledWith('/login')
    expect(getStudentEvaluations).not.toHaveBeenCalled()
  })

  it('expose une erreur quand le service échoue', async () => {
    getStudentEvaluations.mockRejectedValue(new Error('boom'))
    const u = await setup()
    expect(u.error.value).toBe('Impossible de charger les évaluations')
    expect(u.loading.value).toBe(false)
  })

  it('startEvaluation démarre puis navigue vers TakeEvaluation', async () => {
    getStudentEvaluations.mockResolvedValue({ success: true, data: [] })
    startEvaluation.mockResolvedValue({ success: true, data: { id: 99 } })
    const u = await setup()
    await u.startEvaluation({ id: 7 })
    expect(startEvaluation).toHaveBeenCalledWith(7, 42)
    expect(push).toHaveBeenCalledWith({
      name: 'TakeEvaluation', params: { id: 7 }, query: { submission_id: 99 },
    })
  })

  it('continueEvaluation navigue avec la soumission en cours', async () => {
    getStudentEvaluations.mockResolvedValue({ success: true, data: [] })
    const u = await setup()
    u.continueEvaluation({ id: 5, student_submission: { id: 12 } })
    expect(push).toHaveBeenCalledWith({
      name: 'TakeEvaluation', params: { id: 5 }, query: { submission_id: 12 },
    })
  })
})
