/**
 * Test de MONTAGE de la vue MatiereDetails (G10 — décomposition < 300 lignes).
 *
 * Après extraction des fonctions pures (createEmptyLesson / buildLessonPayload /
 * resolveEvaluationRoute) dans utils/matiereDetails, vérifie que la vue monte
 * sans erreur, déclenche le chargement (getMatiereDetails(id)) au montage et
 * reflète la matière (parité de câblage).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getMatiereDetails = vi.fn()
vi.mock('@/services/lms', () => ({
  default: {
    getMatiereDetails: (...a) => getMatiereDetails(...a),
    hideSeance: vi.fn()
  }
}))
vi.mock('@/services/lesson', () => ({
  default: {
    createLesson: vi.fn(),
    deleteLesson: vi.fn(),
    publishLesson: vi.fn(),
    unpublishLesson: vi.fn()
  }
}))
vi.mock('@/services/api', () => ({
  auth: { getUser: () => ({ id: 1, role: 'enseignant' }) }
}))

import MatiereDetails from '@/views/matieres/MatiereDetails.vue'

const SAMPLE = {
  success: true,
  data: {
    matiere: { id: 1, nom: 'Mathématiques', code: 'MAT', coefficient: 2 },
    lessons: [{ id: 10, title: 'Leçon 1' }],
    seances_programmees: [],
    evaluations_programmees: [],
    classes_concernees: [],
    statistiques: { nombre_lessons: 1 }
  }
}

function mountView() {
  return mount(MatiereDetails, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' },
        LessonCard: true,
        MatiereSeancesTab: true,
        MatiereEvaluationsTab: true,
        MatiereClassesTab: true
      },
      mocks: {
        $route: { params: { id: '1' } },
        $router: { push: vi.fn(), back: vi.fn() }
      }
    }
  })
}

describe('MatiereDetails (G10) — montage', () => {
  beforeEach(() => {
    getMatiereDetails.mockReset()
    getMatiereDetails.mockResolvedValue(SAMPLE)
  })

  it('monte et charge les détails de la matière au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.matiere-details-content').exists()).toBe(true)
    expect(getMatiereDetails).toHaveBeenCalledWith(1)
    expect(w.find('.page-title').text()).toContain('Mathématiques')
  })

  it('rend les onglets (Leçons / Séances / Évaluations / Classes)', async () => {
    const w = mountView()
    await flushPromises()

    const text = w.text()
    expect(text).toContain('Leçons')
    expect(text).toContain('Séances')
    expect(text).toContain('Évaluations')
    expect(text).toContain('Classes')
  })
})
