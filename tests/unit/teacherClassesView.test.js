/**
 * Test de MONTAGE de la vue TeacherClasses (G10 — script déjà < 300, vérif parité).
 *
 * Cache vide → fetch ; monte sans erreur et appelle getClasses() + getMatieres().
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getClasses = vi.fn()
const getMatieres = vi.fn()
vi.mock('@/services/klassci', () => ({
  klassciService: {
    getClasses: (...a) => getClasses(...a),
    getMatieres: (...a) => getMatieres(...a),
    getClasseEtudiants: vi.fn().mockResolvedValue([])
  },
  default: {}
}))
vi.mock('@/services/cache', () => ({
  readCache: vi.fn(() => null),
  writeCache: vi.fn()
}))

import TeacherClasses from '@/views/teacher/TeacherClasses.vue'

function mountView() {
  return mount(TeacherClasses, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' }
      }
    }
  })
}

describe('TeacherClasses (G10) — montage', () => {
  beforeEach(() => {
    getClasses.mockReset()
    getMatieres.mockReset()
    getClasses.mockResolvedValue([])
    getMatieres.mockResolvedValue([])
  })

  it('monte sans erreur et charge classes + matières au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.classes-container').exists()).toBe(true)
    expect(getClasses).toHaveBeenCalled()
    expect(getMatieres).toHaveBeenCalled()
  })
})
