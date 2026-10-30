/**
 * Tableau de bord admin, partie (d) : un échec d'analytics ne se déguise plus en « aucun ».
 *
 * `loadAnalytics` enchaînait trois appels dans un seul `try` : l'échec du premier
 * empêchait les deux autres, et l'échec restait dans la console. `recentUsers` partait
 * de `[]`, si bien que le widget affirmait « Aucun utilisateur récent » sur toute
 * panne. Désormais : trois appels indépendants, `recentUsers` à `null` tant que non
 * mesuré (« indisponible »), et un message du catalogue.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const mockAuth = vi.hoisted(() => ({ getUser: vi.fn(() => ({})), getMeta: vi.fn(() => null) }))
const mockKlassci = vi.hoisted(() => ({
  getClasses: vi.fn(), getMatieres: vi.fn(), getEnseignants: vi.fn(), getUpcomingSeances: vi.fn(),
}))
const mockAnalytics = vi.hoisted(() => ({
  getActivityTrends: vi.fn(), getPendingTasks: vi.fn(), getRecentUsers: vi.fn(), getSystemMetrics: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/api', () => ({ auth: mockAuth }))
vi.mock('@/services/klassci', () => ({ klassciService: mockKlassci }))
vi.mock('@/services/analytics', () => ({ analyticsService: mockAnalytics }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))

import { useAdminDashboard } from '@/composables/useAdminDashboard'
import DashboardRecentUsers from '@/components/dashboard/DashboardRecentUsers.vue'

const panne = () => Object.assign(new Error('HTTP 500'), { isAxiosError: true, response: { status: 500, data: {} } })

async function monter() {
  let api
  mount(defineComponent({ setup() { api = useAdminDashboard(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  for (const m of [...Object.values(mockKlassci), ...Object.values(mockAnalytics)]) m.mockReset()
  mockKlassci.getClasses.mockResolvedValue([])
  mockKlassci.getMatieres.mockResolvedValue([])
  mockKlassci.getEnseignants.mockResolvedValue([])
  mockAnalytics.getSystemMetrics.mockResolvedValue(null)
  mockAnalytics.getActivityTrends.mockResolvedValue({ points: [1] })
  mockAnalytics.getPendingTasks.mockResolvedValue({ pending_grading: { count: 2 } })
  mockAnalytics.getRecentUsers.mockResolvedValue([{ id: 1, name: 'Awa' }])
})

describe('loadAnalytics — trois sources indépendantes', () => {
  it('l échec des tendances n empêche ni les tâches ni les utilisateurs récents', async () => {
    mockAnalytics.getActivityTrends.mockRejectedValue(panne())
    const s = await monter()
    expect(mockAnalytics.getPendingTasks).toHaveBeenCalled()
    expect(mockAnalytics.getRecentUsers).toHaveBeenCalled()
    expect(s.pendingTasks.value.pending_grading.count).toBe(2)
    expect(s.recentUsers.value).toEqual([{ id: 1, name: 'Awa' }])
    expect(s.loading.value.analytics).toBe(false)
  })

  it('les utilisateurs récents en échec restent NON MESURÉS (null), pas une liste vide', async () => {
    mockAnalytics.getRecentUsers.mockRejectedValue(panne())
    const s = await monter()
    expect(s.recentUsers.value).toBeNull()
  })

  it('un échec se dit, avec le message du catalogue', async () => {
    mockAnalytics.getPendingTasks.mockRejectedValue(panne())
    const s = await monter()
    expect(s.analyticsError.value).toBe(ERROR_MESSAGES.server)
  })

  it('aucun message quand tout réussit', async () => {
    const s = await monter()
    expect(s.analyticsError.value).toBe('')
  })
})

describe('DashboardRecentUsers — « indisponible » n est pas « aucun »', () => {
  const rendre = (users) => mount(DashboardRecentUsers, { props: { users }, global: { stubs: { RouterLink: true } } })

  it('un compte non mesuré (null) dit « indisponible », jamais « Aucun utilisateur récent »', () => {
    const w = rendre(null)
    expect(w.text()).toContain('Utilisateurs récents indisponibles')
    expect(w.text()).not.toContain('Aucun utilisateur récent')
  })

  it('une liste vide mesurée dit « Aucun utilisateur récent »', () => {
    expect(rendre([]).text()).toContain('Aucun utilisateur récent')
  })
})
