/**
 * Test de MONTAGE de la vue ClasseDetails (G10 — script déjà < 300, vérif parité).
 *
 * Monte sans erreur et déclenche le chargement (getClasseDetails(id)) au montage.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getClasseDetails = vi.fn()
vi.mock('@/services/lms', () => ({
  default: {
    getClasseDetails: (...a) => getClasseDetails(...a),
    getClasseEtudiants: vi.fn().mockResolvedValue({ success: true, data: { etudiants: [] } }),
    getUpcomingSeances: vi.fn().mockResolvedValue({ success: true, data: { seances: [] } })
  }
}))
vi.mock('@/services/klassci', () => ({
  default: { getMatieres: vi.fn().mockResolvedValue([]) },
  klassciService: { getMatieres: vi.fn().mockResolvedValue([]) }
}))
vi.mock('@/services/api', () => ({
  auth: { getUser: () => ({ id: 1, role: 'enseignant' }) }
}))

import ClasseDetails from '@/views/classes/ClasseDetails.vue'

function mountView() {
  return mount(ClasseDetails, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' }
      },
      mocks: {
        $route: { params: { id: '5' } },
        $router: { push: vi.fn(), back: vi.fn() }
      }
    }
  })
}

describe('ClasseDetails (G10) — montage', () => {
  beforeEach(() => {
    getClasseDetails.mockReset()
    getClasseDetails.mockResolvedValue({ success: false, message: 'vide' })
  })

  it('monte sans erreur et charge la classe au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.classe-details').exists()).toBe(true)
    expect(getClasseDetails).toHaveBeenCalledWith(5)
  })
})
