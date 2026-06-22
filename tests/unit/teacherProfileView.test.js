/**
 * Test de MONTAGE de la vue TeacherProfile (G10 — script déjà < 300, vérif parité).
 *
 * Monte sans erreur ; lit le user (auth.getUser) et charge les stats au montage.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const getStats = vi.fn()
vi.mock('@/services/api', () => ({
  auth: { getUser: (...a) => getUser(...a) },
  teacherStats: { getStats: (...a) => getStats(...a) }
}))

import TeacherProfile from '@/views/teacher/TeacherProfile.vue'

function mountView() {
  return mount(TeacherProfile, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' }
      },
      mocks: {
        $route: { params: {} },
        $router: { push: vi.fn(), back: vi.fn() }
      }
    }
  })
}

describe('TeacherProfile (G10) — montage', () => {
  beforeEach(() => {
    getUser.mockReset()
    getStats.mockReset()
    getUser.mockReturnValue({ id: 1, nom: 'Doe', prenom: 'John', email: 'j@d.fr', role: 'enseignant' })
    getStats.mockResolvedValue({})
  })

  it('monte sans erreur et charge user + stats au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.profile-container').exists()).toBe(true)
    expect(getUser).toHaveBeenCalled()
    expect(getStats).toHaveBeenCalled()
  })
})
