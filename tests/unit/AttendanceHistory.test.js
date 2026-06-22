/**
 * Test de montage de la vue AttendanceHistory (G7, Options API).
 * Vérifie le montage sans erreur (route + services mockés) et le rendu du
 * conteneur racine. Enfants stubbés via shallow ; chargement neutralisé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/lms', () => {
  const p = new Proxy({}, {
    get: () => vi.fn().mockResolvedValue({ success: false, data: { seances: [], pagination: {} } })
  })
  return { default: p, lmsService: p }
})
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ role: 'coordinateur', name: 'X' }) } }))

import AttendanceHistory from '@/views/attendance/AttendanceHistory.vue'

describe('AttendanceHistory (G7) — montage', () => {
  it('monte sans erreur et rend le conteneur racine', () => {
    const w = mount(AttendanceHistory, {
      shallow: true,
      global: {
        stubs: { DashboardLayout: { template: '<div><slot /></div>' } },
        mocks: { $route: { params: {}, query: {} }, $router: { push: vi.fn() } }
      }
    })
    expect(w.find('.attendance-history-container').exists()).toBe(true)
  })
})
