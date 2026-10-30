/**
 * Test du composable useAdminHub (#G1 ≤300) : chargement parallèle des compteurs
 * (classes/matières/enseignants) et des stats du dashboard, lues sous `data` comme
 * le serveur les rend. Service KLASSCI mocké ; la traversée du vrai client HTTP est
 * couverte par ecransFormeServeur.test.js.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const klassciMock = vi.hoisted(() => ({
  getClasses: vi.fn(),
  getMatieres: vi.fn(),
  getEnseignants: vi.fn(),
}))
const dashboardMock = vi.hoisted(() => ({
  getStats: vi.fn(),
}))

vi.mock('@/services/klassci', () => ({
  klassciService: klassciMock,
}))

vi.mock('@/services/api', () => ({
  dashboard: dashboardMock,
}))

import { useAdminHub } from '@/composables/useAdminHub'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminHub(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminHub (#G1)', () => {
  beforeEach(() => {
    klassciMock.getClasses.mockReset().mockResolvedValue([
      { id: 1, places_occupees: 10 },
      { id: 2, nb_etudiants: 5 },
    ])
    klassciMock.getMatieres.mockReset().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    klassciMock.getEnseignants.mockReset().mockResolvedValue([{ id: 1 }])
    // Forme serveur (AdminDashboardService::aggregate) : compteurs SOUS `data`,
    // sans aucun compteur de séances ni d'évaluations.
    dashboardMock.getStats.mockReset().mockResolvedValue({
      success: true,
      data: { users: { total: 50, students: 42, teachers: 8 }, quizzes: { total: 5, total_attempts: 9 } },
    })
  })

  it('compte classes, matières et enseignants', async () => {
    const h = await setup()
    expect(h.stats.value.classes).toBe(2)
    expect(h.stats.value.matieres).toBe(3)
    expect(h.stats.value.enseignants).toBe(1)
    expect(h.loading.value).toBe(false)
  })

  it('somme les classes KLASSCI ; séances et évaluations non mesurées (null), jamais le nombre de quiz', async () => {
    const h = await setup()
    expect(h.stats.value.etudiants).toBe(15) // somme des classes KLASSCI prioritaire
    expect(h.stats.value.seances).toBeNull()
    expect(h.stats.value.evaluations).toBeNull()
  })

  it('retombe sur dashboard.users.students si les classes ne portent pas de compteur étudiants', async () => {
    klassciMock.getClasses.mockResolvedValue([{ id: 1 }, { id: 2 }])
    const h = await setup()
    expect(h.stats.value.etudiants).toBe(42)
  })

  it('reste robuste si dashboard.getStats échoue', async () => {
    dashboardMock.getStats.mockRejectedValueOnce(new Error('down'))
    const h = await setup()
    expect(h.stats.value.classes).toBe(2)
    expect(h.stats.value.matieres).toBe(3)
    expect(h.stats.value.enseignants).toBe(1)
    expect(h.stats.value.evaluations).toBeNull()
    expect(h.loading.value).toBe(false)
  })

  it('#238 — signale un chargement partiel quand une source échoue', async () => {
    dashboardMock.getStats.mockRejectedValueOnce(new Error('down'))
    const h = await setup()
    expect(h.error.value).toBeTruthy()
    expect(h.error.value).toContain('statistiques') // source en échec nommée
    expect(h.stats.value.classes).toBe(2) // les autres chiffres restent dispo
  })

  it('#238 — pas d\'erreur quand toutes les sources chargent', async () => {
    const h = await setup()
    expect(h.error.value).toBeNull()
  })
})
