/**
 * Lot « Réessayer », PR B1 : useSeanceManagement relaie le `canRetry` de useCoordinatorSeances
 * (sans quoi la vue, qui lit `v-if="canRetry"`, ne montrerait jamais « Réessayer », même sur panne).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const coord = vi.hoisted(() => ({ canRetry: null }))
vi.mock('@/composables/useCoordinatorSeances', async () => {
  const { ref: r } = await import('vue')
  coord.canRetry = r(false)
  return {
    useCoordinatorSeances: () => ({
      loading: r(false), error: r('Refus'), canRetry: coord.canRetry, seances: r([]), classes: r([]),
      enseignants: r([]), filters: r({}), loadSeances: vi.fn(), loadClasses: vi.fn(), loadEnseignants: vi.fn(),
      refresh: vi.fn(), refreshData: vi.fn(),
    }),
  }
})
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/composables/useTrackedVisioJoin', () => ({ useTrackedVisioJoin: () => ({ joinVisio: vi.fn() }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { id: 1, role: 'coordinateur' } }) }))
vi.mock('@/composables/useToast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }))
vi.mock('@/services/lms', () => ({ default: {} }))
vi.mock('@/services/cache', () => ({ clearCacheByPrefix: vi.fn() }))

import { useSeanceManagement } from '@/composables/useSeanceManagement'

describe('useSeanceManagement — canRetry relayé', () => {
  it('rend le canRetry de useCoordinatorSeances, et le suit', async () => {
    let api
    mount(defineComponent({ setup() { api = useSeanceManagement(); return () => null } }))
    await flushPromises()
    expect(api.canRetry.value).toBe(false)
    coord.canRetry.value = true
    expect(api.canRetry.value).toBe(true)
  })
})
