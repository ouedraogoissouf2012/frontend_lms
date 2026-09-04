/**
 * Test de MONTAGE de la vue TeacherStats (G10 — script déjà < 300, vérif parité).
 *
 * Cache vide → fetch ; monte sans erreur et appelle getTeacherDashboard().
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getTeacherDashboard = vi.fn()
vi.mock('@/services/klassci', () => ({
  klassciService: { getTeacherDashboard: (...a) => getTeacherDashboard(...a) },
  default: { getTeacherDashboard: (...a) => getTeacherDashboard(...a) }
}))
// `useCachedResource` (SWR) lit `readCacheStale`, pas `readCache` : sans lui le
// mock renvoyait `undefined`, le chargement echouait avant d'atteindre le service,
// et l'assertion « getTeacherDashboard appele » tombait sans rapport avec la vue.
// `{ data: null }` = cache VIDE, donc chargement froid puis fetch — le cas teste ici.
vi.mock('@/services/cache', () => ({
  readCache: vi.fn(() => null),
  readCacheStale: vi.fn(() => ({ data: null })),
  writeCache: vi.fn()
}))

import TeacherStats from '@/views/teacher/TeacherStats.vue'

function mountView() {
  return mount(TeacherStats, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' }
      }
    }
  })
}

describe('TeacherStats (G10) — montage', () => {
  beforeEach(() => {
    getTeacherDashboard.mockReset()
    getTeacherDashboard.mockResolvedValue({ matieres: [], statistiques: {}, evaluations: [], seances: [] })
  })

  it('monte sans erreur et charge le dashboard au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.stats-container').exists()).toBe(true)
    expect(getTeacherDashboard).toHaveBeenCalled()
  })
})
