/**
 * Composable useTeacherEvaluations (#278) — chargement + branches de REPLI, qui
 * n'étaient pas couvertes. On mocke les services (KLASSCI/LMS/cache) et on vérifie
 * le comportement dégradé : KLASSCI en échec bascule sur le dashboard enseignant,
 * un double échec ne casse pas, et l'échec LMS retombe proprement sur [].
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { klassci, evaluation } = vi.hoisted(() => ({
  klassci: {
    getClasses: vi.fn(),
    getMatieres: vi.fn(),
    getEvaluations: vi.fn(),
    getTeacherDashboard: vi.fn(),
  },
  evaluation: { getEvaluations: vi.fn() },
}))

vi.mock('@/services/klassci', () => ({ default: klassci }))
vi.mock('@/services/evaluation', () => ({ default: evaluation }))
vi.mock('@/services/cache', () => ({ readCache: vi.fn(() => null), writeCache: vi.fn() }))

import { useTeacherEvaluations } from '@/composables/useTeacherEvaluations'

beforeEach(() => {
  vi.clearAllMocks()
  klassci.getClasses.mockResolvedValue([])
  klassci.getMatieres.mockResolvedValue([])
  klassci.getEvaluations.mockResolvedValue({ success: true, data: [] })
  evaluation.getEvaluations.mockResolvedValue({ success: true, data: [] })
})

describe('useTeacherEvaluations (#278) — chargement & replis', () => {
  it('KLASSCI OK → peuple evaluationsKlassci', async () => {
    klassci.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsKlassci()
    expect(c.evaluationsKlassci.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(klassci.getTeacherDashboard).not.toHaveBeenCalled()
  })

  it('KLASSCI échoue → REPLI sur le dashboard enseignant', async () => {
    klassci.getEvaluations.mockRejectedValue(new Error('403 par classe'))
    klassci.getTeacherDashboard.mockResolvedValue({ evaluations: [{ id: 9 }] })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsKlassci()
    expect(klassci.getTeacherDashboard).toHaveBeenCalled()
    expect(c.evaluationsKlassci.value).toEqual([{ id: 9 }])
  })

  it('KLASSCI ET dashboard échouent → reste vide, aucun crash', async () => {
    klassci.getEvaluations.mockRejectedValue(new Error('403'))
    klassci.getTeacherDashboard.mockRejectedValue(new Error('500'))
    const c = useTeacherEvaluations()
    await c.loadEvaluationsKlassci()
    expect(c.evaluationsKlassci.value).toEqual([])
  })

  it('échec LMS → evaluationsLMS retombe sur [] (dégradation propre)', async () => {
    evaluation.getEvaluations.mockRejectedValue(new Error('réseau'))
    const c = useTeacherEvaluations()
    await c.loadEvaluationsLMS()
    expect(c.evaluationsLMS.value).toEqual([])
  })

  it('LMS OK → mappe questions_count / submissions_count', async () => {
    evaluation.getEvaluations.mockResolvedValue({
      success: true,
      data: [{ id: 3, questions: [{}, {}], submissions: [{}] }],
    })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsLMS()
    expect(c.evaluationsLMS.value[0]).toMatchObject({ id: 3, questions_count: 2, submissions_count: 1 })
  })

  it('loadData orchestre le tout et repose loading à false', async () => {
    klassci.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 1 }] })
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(c.loading.value).toBe(false)
    expect(c.evaluationsKlassci.value).toHaveLength(1)
    expect(c.error.value).toBeNull()
  })
})
