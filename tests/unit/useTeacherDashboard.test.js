/**
 * Test du composable useTeacherDashboard (#H11 ≤300) : chargement du dashboard
 * KLASSCI avec cache, navigation matière, formatage de date. Services auth,
 * klassci, cache et router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { authMock, apiDashboardMock, klassciMock, lmsMock, cacheMock, pushMock } = vi.hoisted(() => ({
  authMock: { getUser: vi.fn() },
  apiDashboardMock: { getTeacherDashboard: vi.fn() },
  klassciMock: { getTeacherDashboard: vi.fn() },
  lmsMock: { getEnseignants: vi.fn(), getMyMatieres: vi.fn(), getMyTeachingSeances: vi.fn() },
  cacheMock: { clearCache: vi.fn(), readCache: vi.fn(), writeCache: vi.fn() },
  pushMock: vi.fn(),
}))

vi.mock('@/services/api', () => ({ auth: authMock, dashboard: apiDashboardMock }))
vi.mock('@/services/klassci', () => ({ klassciService: klassciMock }))
vi.mock('@/services/lms', () => ({ default: lmsMock }))
vi.mock('@/services/cache', () => ({
  clearCache: cacheMock.clearCache,
  readCache: cacheMock.readCache,
  writeCache: cacheMock.writeCache,
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: pushMock }) }))

import { useTeacherDashboard } from '@/composables/useTeacherDashboard'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherDashboard(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherDashboard (#H11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.getUser.mockReturnValue({ id: 3, klassci_id: 200001, name: 'Prof X', email: 'prof@example.test' })
    cacheMock.readCache.mockReturnValue(null)
    klassciMock.getTeacherDashboard.mockResolvedValue({ matieres: [{ id: 1 }], classes: [] })
    apiDashboardMock.getTeacherDashboard.mockResolvedValue(null)
    lmsMock.getEnseignants.mockResolvedValue({ success: true, data: [] })
    lmsMock.getMyMatieres.mockResolvedValue({ success: true, data: [] })
    lmsMock.getMyTeachingSeances.mockResolvedValue({ data: [] })
  })

  it('charge le dashboard depuis le service et le met en cache', async () => {
    const d = await setup()
    expect(d.dashboardData.value.matieres).toHaveLength(1)
    expect(cacheMock.writeCache).toHaveBeenCalledWith('teacher_dashboard', expect.any(Object))
    expect(d.loading.value).toBe(false)
  })

  it('utilise le cache sans rappeler le service quand présent', async () => {
    cacheMock.readCache.mockReturnValue({ matieres: [{ id: 9 }] })
    const d = await setup()
    expect(d.dashboardData.value.matieres[0].id).toBe(9)
    expect(klassciMock.getTeacherDashboard).not.toHaveBeenCalled()
  })

  it('ignore un cache vide, le supprime et tente un rafraîchissement', async () => {
    cacheMock.readCache.mockReturnValue({ matieres: [], classes: [], statistiques: {} })
    const d = await setup()
    expect(cacheMock.clearCache).toHaveBeenCalledWith('teacher_dashboard')
    expect(klassciMock.getTeacherDashboard).toHaveBeenCalled()
    expect(d.dashboardData.value.matieres).toHaveLength(1)
  })

  it('utilise le fallback enseignant enrichi si KLASSCI retourne un dashboard vide', async () => {
    klassciMock.getTeacherDashboard.mockResolvedValue({ matieres: [], classes: [], statistiques: {} })
    lmsMock.getEnseignants.mockResolvedValue({
      success: true,
      data: [
        {
          id: 200001,
          nom: 'Prof',
          prenom: 'X',
          matieres: [{ id: 7, nom: 'Maths', classes: [{ id: 5, nb_etudiants: 12 }] }],
          statistiques: { total_lecons: 4 },
        },
      ],
    })

    const d = await setup()

    expect(lmsMock.getEnseignants).toHaveBeenCalledWith(true)
    expect(d.dashboardData.value.matieres).toHaveLength(1)
    expect(d.dashboardData.value.classes).toHaveLength(1)
    expect(d.dashboardData.value.statistiques.total_etudiants).toBe(12)
    expect(d.dashboardData.value.statistiques.total_lecons).toBe(4)
  })

  it('utilise /dashboard/teacher avant les fallbacks LMS si disponible', async () => {
    klassciMock.getTeacherDashboard.mockRejectedValue(new Error('boom'))
    apiDashboardMock.getTeacherDashboard.mockResolvedValue({
      success: true,
      data: {
        matieres: [{ id: 2, nom: 'Physique' }],
        classes: [{ id: 9 }],
        statistiques: { total_etudiants: 30 },
      },
    })

    const d = await setup()

    expect(apiDashboardMock.getTeacherDashboard).toHaveBeenCalled()
    expect(lmsMock.getEnseignants).not.toHaveBeenCalled()
    expect(d.dashboardData.value.matieres).toHaveLength(1)
    expect(d.dashboardData.value.statistiques.total_etudiants).toBe(30)
  })

  it('reconstruit le dashboard depuis les matières LMS si le dashboard KLASSCI échoue', async () => {
    cacheMock.readCache.mockReturnValue(null)
    klassciMock.getTeacherDashboard.mockRejectedValue(new Error('boom'))
    lmsMock.getMyMatieres.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          nom: 'Maths',
          classes: [{ id: 5, name: '6e A', nb_etudiants: 18 }],
          lessons: [{ id: 10 }, { id: 11 }],
        },
      ],
    })
    lmsMock.getMyTeachingSeances.mockResolvedValue({ data: [{ id: 9 }] })

    const d = await setup()

    expect(d.error.value).toBeNull()
    expect(d.dashboardData.value.matieres).toHaveLength(1)
    expect(d.dashboardData.value.classes).toHaveLength(1)
    expect(d.dashboardData.value.seances).toHaveLength(1)
    expect(d.dashboardData.value.statistiques.total_etudiants).toBe(18)
    expect(d.dashboardData.value.statistiques.total_lecons).toBe(2)
    expect(cacheMock.writeCache).toHaveBeenCalledWith('teacher_dashboard', expect.any(Object))
  })

  it('retombe sur le cache si le rafraîchissement échoue', async () => {
    cacheMock.readCache
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ matieres: [{ id: 8 }], classes: [] })
    klassciMock.getTeacherDashboard.mockRejectedValue(new Error('boom'))
    const d = await setup()
    expect(d.error.value).toBeNull()
    expect(d.dashboardData.value.matieres[0].id).toBe(8)
  })

  it('navigue vers la matière quand un id est résolu', async () => {
    const d = await setup()
    d.navigateToMatiere({ matiere_id: 42 })
    expect(pushMock).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 42 } })
  })

  it('signale une erreur si aucun id de matière n\'est trouvé', async () => {
    const d = await setup()
    d.navigateToMatiere({})
    expect(pushMock).not.toHaveBeenCalled()
    expect(d.error.value).toBe('Impossible de naviguer vers cette matière')
  })

  it('formate les dates et gère l\'absence de date', async () => {
    const d = await setup()
    expect(d.formatDate(null)).toBe('N/A')
    expect(d.formatDate('2024-03-10')).toMatch(/2024/)
  })
})
