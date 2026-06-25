/**
 * Test du composable useStudentDashboard (#G1) : chargement KLASSCI + cache
 * (lecture immédiate + rafraîchissement arrière-plan) + état d'erreur.
 * Services api(auth)/klassci/cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  getStudentDashboard: vi.fn(),
  readCache: vi.fn(),
  writeCache: vi.fn(),
}))

vi.mock('@/services/api', () => ({ auth: { getUser: (...a) => h.getUser(...a) } }))
vi.mock('@/services/klassci', () => ({
  klassciService: { getStudentDashboard: (...a) => h.getStudentDashboard(...a) },
}))
vi.mock('@/services/cache', () => ({
  readCache: (...a) => h.readCache(...a),
  writeCache: (...a) => h.writeCache(...a),
}))

import { useStudentDashboard } from '@/composables/useStudentDashboard'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useStudentDashboard(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

const FRESH = { classe: { name: '6e A' }, statistiques: { moyenne_generale: 12 }, notes: [] }
const CACHED = { classe: { name: 'Ancienne' }, statistiques: {}, notes: [] }

describe('useStudentDashboard (#G1)', () => {
  beforeEach(() => {
    h.getUser.mockReset().mockReturnValue({ id: 1, name: 'Élève' })
    h.getStudentDashboard.mockReset().mockResolvedValue(FRESH)
    h.readCache.mockReset()
    h.writeCache.mockReset()
  })

  it('cache miss : appelle le service et remplit dashboardData', async () => {
    h.readCache.mockReturnValue(null)
    const d = await setup()
    expect(h.getStudentDashboard).toHaveBeenCalled()
    expect(d.dashboardData.value).toEqual(FRESH)
    expect(d.loading.value).toBe(false)
    expect(d.user.value).toEqual({ id: 1, name: 'Élève' })
    expect(h.writeCache).toHaveBeenCalledWith('student_dashboard', FRESH)
  })

  it('cache hit : sert le cache immédiatement puis rafraîchit en arrière-plan', async () => {
    h.readCache.mockReturnValue(CACHED)
    const d = await setup()
    // refreshInBackground a aussi appelé le service → données fraîches au final
    expect(h.getStudentDashboard).toHaveBeenCalled()
    expect(d.dashboardData.value).toEqual(FRESH)
    expect(d.loading.value).toBe(false)
  })

  it('loadDashboard(true) force le rafraîchissement (ignore le cache)', async () => {
    h.readCache.mockReturnValue(CACHED)
    const d = await setup()
    h.getStudentDashboard.mockClear()
    await d.loadDashboard(true)
    await flushPromises()
    expect(h.getStudentDashboard).toHaveBeenCalledTimes(1)
    expect(d.dashboardData.value).toEqual(FRESH)
  })

  it('erreur service : expose un message, ne jette pas', async () => {
    h.readCache.mockReturnValue(null)
    h.getStudentDashboard.mockRejectedValue(new Error('boom'))
    const d = await setup()
    expect(d.error.value).toBe('Impossible de charger vos données. Veuillez réessayer.')
    expect(d.loading.value).toBe(false)
  })
})
