/**
 * Test du composable useTeacherHub (#H11 ≤300) : agrégation parallèle des
 * compteurs du hub enseignant (classes, matières, leçons, séances à venir,
 * évaluations, étudiants). Services KLASSCI + LMS mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { klassci, lms } = vi.hoisted(() => ({
  klassci: {
    getClasses: vi.fn(),
    getMatieres: vi.fn(),
    getTeacherDashboard: vi.fn(),
    getClasseEtudiants: vi.fn(),
  },
  lms: { getMyTeachingSeances: vi.fn() },
}))

vi.mock('@/services/klassci', () => ({ klassciService: klassci }))
vi.mock('@/services/lms', () => ({ lmsService: lms }))

import { useTeacherHub } from '@/composables/useTeacherHub'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherHub(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherHub (#H11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    klassci.getClasses.mockResolvedValue([{ id: 1 }, { id: 2 }])
    klassci.getMatieres.mockResolvedValue([{ id: 10 }, { id: 11 }, { id: 12 }])
    klassci.getTeacherDashboard.mockResolvedValue({ nb_lecons: 7, nb_evaluations: 4 })
    klassci.getClasseEtudiants.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    lms.getMyTeachingSeances.mockResolvedValue({ data: [] })
  })

  it('compte classes, matières, leçons et évaluations depuis les services', async () => {
    const h = await setup()
    expect(h.stats.value.classes).toBe(2)
    expect(h.stats.value.matieres).toBe(3)
    expect(h.stats.value.lecons).toBe(7)
    expect(h.stats.value.evaluations).toBe(4)
    expect(h.loading.value).toBe(false)
  })

  it('totalise les étudiants sur toutes les classes', async () => {
    const h = await setup()
    expect(h.stats.value.etudiants).toBe(6) // 3 par classe × 2 classes
  })

  it('ne compte que les séances à venir (date >= maintenant)', async () => {
    const futur = new Date(Date.now() + 86400000).toISOString()
    const passe = new Date(Date.now() - 86400000).toISOString()
    lms.getMyTeachingSeances.mockResolvedValue({
      data: [{ date_seance: futur }, { date_seance: passe }, { programmation: { date: futur } }],
    })
    const h = await setup()
    expect(h.stats.value.seancesAVenir).toBe(2)
  })

  it('reste robuste si un service échoue (catch → valeurs par défaut)', async () => {
    klassci.getClasses.mockRejectedValue(new Error('boom'))
    const h = await setup()
    expect(h.stats.value.classes).toBe(0)
    expect(h.stats.value.etudiants).toBe(0)
    expect(h.loading.value).toBe(false)
  })
})
