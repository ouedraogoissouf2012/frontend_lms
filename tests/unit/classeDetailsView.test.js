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
// Le rôle est lu à chaque appel : un test peut le changer avant le montage.
const session = vi.hoisted(() => ({ role: 'enseignant' }))
vi.mock('@/services/api', () => ({
  auth: { getUser: () => ({ id: 1, role: session.role }) }
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

  // Ce que l'ÉCRAN montre, pas seulement ce que le composable expose : ni
  // onglet, ni carte « Étudiants » pour un élève ; les deux restent pour le
  // personnel (ADR-GHSA-gg7j-01 côté backend).
  const chargeUneClasseSansRoster = () => getClasseDetails.mockResolvedValue({
    success: true,
    data: { classe: { nom: 'B2 COM' }, etudiants: [], matieres_disponibles: [{ id: 7 }] }
  })

  it('un élève ne voit ni l onglet ni la carte Étudiants', async () => {
    session.role = 'etudiant'
    chargeUneClasseSansRoster()
    const w = mountView()
    await flushPromises()

    expect(w.text()).not.toContain('Étudiants')
    expect(w.findAll('.tabs-nav button').map(b => b.text())).not.toContainEqual(expect.stringContaining('Étudiants'))
  })

  it('le personnel garde l onglet et la carte Étudiants', async () => {
    session.role = 'enseignant'
    chargeUneClasseSansRoster()
    const w = mountView()
    await flushPromises()

    expect(w.findAll('.tabs-nav button').some(b => b.text().includes('Étudiants'))).toBe(true)
    expect(w.findAll('.stat-label-header').map(l => l.text())).toContain('Étudiants')
  })
})
