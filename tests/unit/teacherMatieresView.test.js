/**
 * Test de MONTAGE de la vue TeacherMatieres (G10 — script déjà < 300, vérif parité).
 *
 * Monte sans erreur et appelle getMyMatieres() au montage.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getMyMatieres = vi.fn()
vi.mock('@/services/lms', () => ({
  default: { getMyMatieres: (...a) => getMyMatieres(...a) }
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

import TeacherMatieres from '@/views/teacher/TeacherMatieres.vue'

function mountView() {
  return mount(TeacherMatieres, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' }
      }
    }
  })
}

describe('TeacherMatieres (G10) — montage', () => {
  beforeEach(() => {
    getMyMatieres.mockReset()
    getMyMatieres.mockResolvedValue({ success: true, data: [] })
  })

  it('monte sans erreur et charge les matières au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.dashboard-content').exists()).toBe(true)
    expect(getMyMatieres).toHaveBeenCalled()
  })
})
