/**
 * Test de MONTAGE de la vue TeacherClasses (G10 — script déjà < 300, vérif parité).
 *
 * Cache vide → fetch ; monte sans erreur et appelle /lms/teacher/classes.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getClasses = vi.fn()
const getMatieres = vi.fn()
const getTeacherClasses = vi.fn()
const getClasseEtudiants = vi.fn()
vi.mock('@/services/klassci', () => ({
  klassciService: {
    getClasses: (...a) => getClasses(...a),
    getMatieres: (...a) => getMatieres(...a),
    getClasseEtudiants: (...a) => getClasseEtudiants(...a)
  },
  default: {}
}))
vi.mock('@/services/lmsClasses', () => ({
  lmsClassesService: {
    getTeacherClasses: (...a) => getTeacherClasses(...a)
  }
}))
vi.mock('@/services/cache', () => ({
  readCache: vi.fn(() => null),
  readCacheStale: vi.fn(() => ({ data: null })),
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
    getTeacherClasses.mockReset()
    getClasseEtudiants.mockReset()
    getClasses.mockResolvedValue([])
    getMatieres.mockResolvedValue([])
    getTeacherClasses.mockResolvedValue([])
    getClasseEtudiants.mockResolvedValue([])
  })

  it('monte sans erreur et charge les classes rattachees au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.classes-container').exists()).toBe(true)
    expect(getTeacherClasses).toHaveBeenCalled()
    // Effectifs toujours via /proxy/classes, un appel pour toutes les cartes.
    expect(getClasses).toHaveBeenCalledTimes(1)
    expect(getMatieres).not.toHaveBeenCalled()
    expect(getClasseEtudiants).not.toHaveBeenCalled()
  })
})
