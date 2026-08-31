/**
 * Test de MONTAGE de la vue StudentSettings (G10 — script déjà < 300, vérif parité).
 *
 * Monte sans erreur ; le user courant est lu via auth.getUser() au montage.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
vi.mock('@/services/api', () => ({
  auth: { getUser: (...a) => getUser(...a), logout: vi.fn(), getInstitution: vi.fn(() => null) }
}))
vi.mock('@/composables/useToast', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}))

import StudentSettings from '@/views/student/StudentSettings.vue'

function mountView() {
  return mount(StudentSettings, {
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

describe('StudentSettings (G10) — montage', () => {
  beforeEach(() => {
    getUser.mockReset()
    getUser.mockReturnValue({ id: 2, nom: 'Roe', prenom: 'Jane', email: 'jane@d.fr', role: 'etudiant' })
  })

  it('monte sans erreur et lit le user au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.settings-container').exists()).toBe(true)
    expect(getUser).toHaveBeenCalled()
  })
})
