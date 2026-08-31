/**
 * Test de montage de la vue TeacherSeances (G7, script setup).
 * Vérifie le montage sans erreur (store/services/cache mockés) et le rendu du
 * conteneur racine. Enfants (SeanceCard, DashboardLayout) stubbés via shallow.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/lms', () => {
  const p = new Proxy({}, {
    get: () => vi.fn().mockResolvedValue({ success: true, data: [] })
  })
  return { default: p, lmsService: p }
})
vi.mock('@/services/klassci', () => ({
  klassciService: new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) })
}))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { id: 1, role: 'enseignant', name: 'X' } })
}))
vi.mock('@/composables/useToast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: vi.fn(), clearCache: vi.fn() }))
vi.mock('@/composables/useTrackedVisioJoin', () => ({
  useTrackedVisioJoin: () => ({ joinTrackedVisio: vi.fn() })
}))

import TeacherSeances from '@/views/TeacherSeances.vue'

describe('TeacherSeances (G7) — montage', () => {
  it('monte sans erreur et rend le conteneur racine', () => {
    const w = mount(TeacherSeances, {
      shallow: true,
      global: {
        stubs: { DashboardLayout: { template: '<div><slot /></div>' } },
        mocks: { $route: { params: {}, query: {} }, $router: { push: vi.fn() } }
      }
    })
    expect(w.find('.seances-container').exists()).toBe(true)
  })
})
