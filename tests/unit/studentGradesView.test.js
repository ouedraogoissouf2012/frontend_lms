/**
 * Test de MONTAGE de la vue StudentGrades (G4 — décomposition < 300 lignes).
 *
 * Vérifie qu'après extraction du composable `useStudentGrades` et des utils purs
 * `studentGrades`, la vue monte sans erreur, déclenche le chargement
 * (GET /my-grades) au montage, et reflète les données (parité de câblage).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock du service HTTP partagé : aucune requête réelle, payload contrôlé.
const getMock = vi.fn()
vi.mock('@/services/api', () => ({
  default: { get: (...args) => getMock(...args) }
}))

// Routeur minimal (la vue n'utilise que router.push dans viewResults).
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

import StudentGrades from '@/views/student/StudentGrades.vue'

const SAMPLE = {
  success: true,
  data: {
    matieres: [
      {
        matiere_id: 1,
        matiere_nom: 'Mathématiques',
        evaluations: [
          { id: 10, titre: 'Devoir 1', type: 'devoir', note: '14', date_evaluation: '2026-02-01' },
          { id: 11, titre: 'Examen', type: 'examen', note: '8', date_evaluation: '2026-03-01' }
        ]
      }
    ],
    moyenne_generale: 11,
    total_matieres: 1,
    total_evaluations: 2
  }
}

function mountView() {
  return mount(StudentGrades, {
    global: {
      stubs: {
        // Rend le contenu par défaut pour pouvoir l'inspecter.
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div><slot /></div>' }
      }
    }
  })
}

describe('StudentGrades (G4) — montage', () => {
  beforeEach(() => {
    getMock.mockReset()
    pushMock.mockReset()
    getMock.mockResolvedValue(SAMPLE)
  })

  it('monte sans erreur et charge les notes au montage', async () => {
    const w = mountView()
    await flushPromises()

    expect(w.find('.grades-container').exists()).toBe(true)
    expect(w.find('.page-title').text()).toContain('Mes Notes')
    expect(getMock).toHaveBeenCalledWith('/my-grades')
  })

  it('reflète les statistiques dérivées (moyenne, totaux, réussite)', async () => {
    const w = mountView()
    await flushPromises()

    const text = w.text()
    expect(text).toContain('11/20')          // moyenne générale
    expect(text).toContain('2 évaluations')  // total évaluations
    expect(text).toContain('50%')            // 1 réussie (14) / 2 → taux
    expect(text).toContain('14/20')          // meilleure note
    expect(text).toContain('Mathématiques')  // option de filtre matière
  })

  it('reste stable quand le backend répond en échec (aucune donnée)', async () => {
    getMock.mockResolvedValue({ success: false, message: 'Erreur' })
    const w = mountView()
    await flushPromises()

    expect(w.find('.grades-container').exists()).toBe(true)
    expect(w.text()).toContain('0/20') // moyenne par défaut
  })
})
