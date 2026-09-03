/**
 * Test de MONTAGE de TeacherHub.vue (G9 — fichier déjà < 300, vérif de parité).
 *
 * Confirme que la vue monte sans erreur et déclenche au montage les appels
 * utiles: dashboard enseignant rattache + séances LMS. Les listes KLASSCI
 * globales ne doivent plus etre appelees pour eviter le N+1 #100.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted : initialise les mocks AVANT le hoisting des vi.mock (sinon la
// factory référencerait un objet non encore initialisé).
const { klassci, lms } = vi.hoisted(() => ({
  klassci: {
    getClasses: vi.fn(),
    getMatieres: vi.fn(),
    getTeacherDashboard: vi.fn(),
    getClasseEtudiants: vi.fn()
  },
  lms: { getMyTeachingSeances: vi.fn() }
}))
vi.mock('@/services/klassci', () => ({ klassciService: klassci }))
vi.mock('@/services/lms', () => ({ lmsService: lms }))

import TeacherHub from '@/views/teacher/TeacherHub.vue'

function mountHub() {
  return mount(TeacherHub, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' }
      }
    }
  })
}

describe('TeacherHub.vue (G9) — montage', () => {
  beforeEach(() => {
    Object.values(klassci).forEach((m) => m.mockReset())
    lms.getMyTeachingSeances.mockReset()
    klassci.getClasses.mockResolvedValue([{ id: 1 }])
    klassci.getMatieres.mockResolvedValue([{ id: 2 }])
    klassci.getTeacherDashboard.mockResolvedValue({
      classes: [{ id: 1, places_occupees: 2 }],
      matieres: [{ id: 2 }],
      nb_lecons: 4,
      nb_evaluations: 3
    })
    klassci.getClasseEtudiants.mockResolvedValue([{ id: 10 }, { id: 11 }])
    lms.getMyTeachingSeances.mockResolvedValue({ data: [] })
  })

  it('monte et charge les statistiques au montage', async () => {
    const w = mountHub()
    await flushPromises()

    expect(w.exists()).toBe(true)
    expect(klassci.getTeacherDashboard).toHaveBeenCalled()
    // La liste des classes est chargée EN PLUS du dashboard : elle seule porte
    // les effectifs. Un appel pour toutes, jamais un roster par classe.
    expect(klassci.getClasses).toHaveBeenCalledTimes(1)
    expect(klassci.getMatieres).not.toHaveBeenCalled()
    expect(klassci.getClasseEtudiants).not.toHaveBeenCalled()
    expect(lms.getMyTeachingSeances).toHaveBeenCalled()
  })
})
