/**
 * Test de montage de la vue SeanceManagement (#H6, script setup + composable).
 * Vérifie le montage sans erreur (router/store/services/cache mockés) et le
 * rendu du conteneur racine. Enfants stubbés via shallow.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))
vi.mock('@/services/lms', () => ({
  default: new Proxy({}, { get: () => vi.fn().mockResolvedValue({ success: true }) })
}))
vi.mock('@/services/klassci', () => ({
  klassciService: new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) })
}))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: vi.fn(), clearCache: vi.fn() }))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { id: 1, role: 'coordinateur', name: 'X' } })
}))
vi.mock('@/composables/useToast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
vi.mock('@/constants/visio', () => ({
  buildJitsiUrl: (r) => `jitsi://${r}`,
  getVisioRoomId: (source) => source?.visio_room_id || source?.room_id || source?.visio?.room_id || null,
  requireVisioRoomId: (source) => source?.visio_room_id || source?.room_id || source?.visio?.room_id || 'room-test'
}))
vi.mock('@/composables/useTrackedVisioJoin', () => ({
  useTrackedVisioJoin: () => ({ joinTrackedVisio: vi.fn() })
}))

import SeanceManagement from '@/views/coordinateur/SeanceManagement.vue'

describe('SeanceManagement (#H6) — montage', () => {
  it('monte sans erreur et rend le conteneur racine', () => {
    const w = mount(SeanceManagement, {
      shallow: true,
      global: {
        stubs: { DashboardLayout: { template: '<div><slot /></div>' } }
      }
    })
    expect(w.find('.seances-container').exists()).toBe(true)
  })
})
