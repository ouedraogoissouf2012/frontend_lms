/**
 * Test de montage de la vue SeanceDetails (G7, Options API).
 * Vérifie que la vue monte sans erreur (route + services mockés) et rend son
 * conteneur racine. Les enfants (DashboardLayout, ContentLoader) sont stubbés
 * via shallow ; les services sont mockés pour neutraliser le chargement.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

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
vi.mock('@/services/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
vi.mock('@/composables/useVisioParticipation', () => ({
  useVisioParticipation: () => ({ joinVisio: vi.fn(), leaveVisio: vi.fn() })
}))

import SeanceDetails from '@/views/seances/SeanceDetails.vue'

describe('SeanceDetails (G7) — montage', () => {
  it('monte sans erreur et rend le conteneur racine', () => {
    const w = mount(SeanceDetails, {
      shallow: true,
      global: {
        stubs: { DashboardLayout: { template: '<div><slot /></div>' } },
        mocks: { $route: { params: { id: '1' }, query: {} }, $router: { push: vi.fn() } }
      }
    })
    expect(w.find('.seance-details').exists()).toBe(true)
  })
})
