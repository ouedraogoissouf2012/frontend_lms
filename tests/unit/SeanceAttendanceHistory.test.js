/**
 * Test de montage de la vue SeanceAttendanceHistory (G7, Options API).
 * Vérifie le montage sans erreur (services mockés) et le rendu du conteneur.
 * Enfants stubbés via shallow ; chargement neutralisé par les mocks.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/lms', () => {
  const p = new Proxy({}, {
    get: () => vi.fn().mockResolvedValue({ success: false, data: { seances: [], pagination: {} } })
  })
  return { default: p, lmsService: p }
})
vi.mock('@/services/attendanceExport', () => ({
  default: { exportToPdf: vi.fn(), exportToExcel: vi.fn() }
}))

import SeanceAttendanceHistory from '@/views/attendance/SeanceAttendanceHistory.vue'

describe('SeanceAttendanceHistory (G7) — montage', () => {
  it('monte sans erreur et rend le conteneur racine', () => {
    const w = mount(SeanceAttendanceHistory, {
      shallow: true,
      global: {
        stubs: { DashboardLayout: { template: '<div><slot /></div>' } },
        mocks: { $route: { params: {}, query: {} }, $router: { push: vi.fn() } }
      }
    })
    expect(w.find('.attendance-container').exists()).toBe(true)
  })
})
