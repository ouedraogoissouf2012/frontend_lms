/**
 * Test du composable useTeacherDashboard (#H11 ≤300) : chargement du dashboard
 * KLASSCI avec cache, navigation matière, formatage de date. Services auth,
 * klassci, cache et router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { authMock, klassciMock, cacheMock, pushMock } = vi.hoisted(() => ({
  authMock: { getUser: vi.fn() },
  klassciMock: { getTeacherDashboard: vi.fn() },
  cacheMock: { readCache: vi.fn(), writeCache: vi.fn() },
  pushMock: vi.fn(),
}))

vi.mock('@/services/api', () => ({ auth: authMock }))
vi.mock('@/services/klassci', () => ({ klassciService: klassciMock }))
vi.mock('@/services/cache', () => ({ readCache: cacheMock.readCache, writeCache: cacheMock.writeCache }))
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
    authMock.getUser.mockReturnValue({ name: 'Prof X' })
    cacheMock.readCache.mockReturnValue(null)
    klassciMock.getTeacherDashboard.mockResolvedValue({ matieres: [{ id: 1 }], classes: [] })
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

  it('expose une erreur si le chargement échoue', async () => {
    cacheMock.readCache.mockReturnValue(null)
    klassciMock.getTeacherDashboard.mockRejectedValue(new Error('boom'))
    const d = await setup()
    expect(d.error.value).toBe('Impossible de charger vos données. Veuillez réessayer.')
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
