/**
 * Test de MONTAGE de la vue TeacherClasses (G10 — script déjà < 300, vérif parité).
 *
 * Cache vide → fetch ; monte sans erreur et appelle le dashboard enseignant.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getClasses = vi.fn()
const getMatieres = vi.fn()
const getTeacherDashboard = vi.fn()
const getClasseEtudiants = vi.fn()
vi.mock('@/services/klassci', () => ({
  klassciService: {
    getClasses: (...a) => getClasses(...a),
    getMatieres: (...a) => getMatieres(...a),
    getTeacherDashboard: (...a) => getTeacherDashboard(...a),
    getClasseEtudiants: (...a) => getClasseEtudiants(...a)
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
    getTeacherDashboard.mockReset()
    getClasseEtudiants.mockReset()
    getClasses.mockResolvedValue([])
    getMatieres.mockResolvedValue([])
    getTeacherDashboard.mockResolvedValue({ classes: [], matieres: [] })
    getClasseEtudiants.mockResolvedValue([])
  })

  it('monte sans erreur et charge les classes rattachees au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.classes-container').exists()).toBe(true)
    expect(getTeacherDashboard).toHaveBeenCalled()
    // La liste des classes est désormais chargée EN PLUS du tableau de bord :
    // elle seule porte les effectifs, que le dashboard ne fournit pas.
    // Un appel pour toutes les classes, jamais un par carte.
    expect(getClasses).toHaveBeenCalledTimes(1)
    expect(getMatieres).not.toHaveBeenCalled()
    expect(getClasseEtudiants).not.toHaveBeenCalled()
  })
})
