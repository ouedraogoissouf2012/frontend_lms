/**
 * Lot « Réessayer », B2 : le tableau de bord admin agrège trois sources (useAdminDashboard).
 * Déplacé de useAdminDashboard.test.js (356 lignes > 300) sans changement : mêmes mocks, même cas.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPush = vi.hoisted(() => vi.fn())
const mockAuth = vi.hoisted(() => ({ getUser: vi.fn(), getMeta: vi.fn() }))
const mockKlassci = vi.hoisted(() => ({
  getClasses: vi.fn(),
  getMatieres: vi.fn(),
  getEnseignants: vi.fn(),
  getUpcomingSeances: vi.fn(),
}))
const mockAnalytics = vi.hoisted(() => ({
  getActivityTrends: vi.fn(),
  getPendingTasks: vi.fn(),
  getRecentUsers: vi.fn(),
  getSystemMetrics: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('@/services/api', () => ({ auth: mockAuth }))
vi.mock('@/services/klassci', () => ({ klassciService: mockKlassci }))
vi.mock('@/services/analytics', () => ({ analyticsService: mockAnalytics }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))

import { useAdminDashboard } from '@/composables/useAdminDashboard'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminDashboard(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

// Lot « Réessayer », B2 (agrégats) : le tableau de bord agrège trois sources. « Réessayer » seulement si
// au moins un échec est une panne passagère ; que des refus, et réessayer n'y changera rien.
describe('useAdminDashboard — Réessayer seulement si une source est en panne', () => {
  const refus = () => Object.assign(new Error('HTTP 401'), { response: { status: 401, data: { reason: 'klassci_token_missing' } }, userMessage: 'Aucun accès KLASSCI.' })
  const panne = () => Object.assign(new Error('HTTP 503'), { response: { status: 503 }, userMessage: 'Service indisponible.' })
  beforeEach(() => {
    mockAuth.getUser.mockReturnValue({})
    mockAuth.getMeta.mockReturnValue(null)
    mockAnalytics.getSystemMetrics.mockResolvedValue(null)
    mockAnalytics.getActivityTrends.mockResolvedValue(null)
    mockAnalytics.getPendingTasks.mockResolvedValue(null)
    mockAnalytics.getRecentUsers.mockResolvedValue([])
    mockKlassci.getUpcomingSeances.mockResolvedValue([])
  })

  it('que des refus : erreur, sans Réessayer ; une panne parmi eux : Réessayer', async () => {
    for (const m of [mockKlassci.getClasses, mockKlassci.getMatieres, mockKlassci.getEnseignants]) m.mockReset().mockRejectedValue(refus())
    const d = await setup()
    expect(d.loadError.value).toBeTruthy()
    expect(d.canRetry.value).toBe(false)

    mockKlassci.getEnseignants.mockReset().mockRejectedValue(panne())
    await d.loadDashboard()
    await flushPromises()
    expect(d.loadError.value).toBeTruthy()
    expect(d.canRetry.value).toBe(true)
  })
})
