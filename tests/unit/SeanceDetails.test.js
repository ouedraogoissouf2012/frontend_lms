/**
 * Test de montage de la vue SeanceDetails (#H6, script setup + composable).
 * Vérifie que la vue monte sans erreur (router + services mockés) et rend son
 * conteneur racine. Les enfants sont stubbés via shallow ; les services sont
 * mockés pour neutraliser le chargement.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), go: vi.fn() })
}))
vi.mock('@/services/lms', () => {
  const p = new Proxy({}, {
    get: () => vi.fn().mockResolvedValue({
      success: false,
      data: { seance: null, visio: null, participants: null }
    })
  })
  return { default: p, lmsService: p }
})
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ role: 'coordinateur', name: 'X' }) } }))
vi.mock('@/composables/useToast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
vi.mock('@/composables/useTrackedVisioJoin', () => ({
  useTrackedVisioJoin: () => ({ joinTrackedVisio: vi.fn() })
}))

import SeanceDetails from '@/views/seances/SeanceDetails.vue'

describe('SeanceDetails (#H6) — montage', () => {
  it('monte sans erreur et rend le conteneur racine', () => {
    const w = mount(SeanceDetails, {
      shallow: true,
      global: {
        stubs: { DashboardLayout: { template: '<div><slot /></div>' } }
      }
    })
    expect(w.find('.seance-details').exists()).toBe(true)
  })
})
