/** Tests de rendu/interaction des composants du dashboard enseignant (#H11 ≤300). */
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import DashboardStatCards from '@/components/teacher/DashboardStatCards.vue'
import DashboardActivityWidgets from '@/components/teacher/DashboardActivityWidgets.vue'
import DashboardMatieresList from '@/components/teacher/DashboardMatieresList.vue'
import DashboardClassesList from '@/components/teacher/DashboardClassesList.vue'
import DashboardEvaluationsList from '@/components/teacher/DashboardEvaluationsList.vue'
import DashboardQuickActions from '@/components/teacher/DashboardQuickActions.vue'

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

// Les compteurs du dashboard enseignant sont animés (count-up). Sous « mouvement
// réduit », le composable pose la valeur finale dès le 1er rendu → assertions
// synchrones déterministes.
const originalMatchMedia = window.matchMedia
beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: true, media: '', addEventListener() {}, removeEventListener() {},
  }))
})
afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('DashboardStatCards (#H11)', () => {
  it('affiche les 4 compteurs depuis dashboardData', () => {
    const w = mount(DashboardStatCards, {
      props: { dashboardData: { matieres: [1, 2], classes: [1], evaluations: [], seances: [1, 2, 3] } },
    })
    expect(w.findAll('.stat-card')).toHaveLength(4)
    expect(w.findAll('.stat-value').map(n => n.text())).toEqual(['2', '1', '0', '3'])
  })
})

describe('DashboardActivityWidgets (#H11)', () => {
  it('affiche les indicateurs de statistiques', () => {
    const w = mount(DashboardActivityWidgets, {
      props: { dashboardData: { statistiques: { total_etudiants: 12, seances_aujourdhui: 2 } } },
    })
    expect(w.findAll('.widget-card')).toHaveLength(2)
    expect(w.text()).toContain('12')
  })
})

describe('DashboardMatieresList (#H11)', () => {
  it('émet navigate au clic sur une carte', async () => {
    const w = mount(DashboardMatieresList, {
      props: { matieres: [{ id: 1, nom: 'Maths', coefficient: 3 }] },
    })
    await w.find('.course-card').trigger('click')
    expect(w.emitted('navigate')[0][0]).toEqual({ id: 1, nom: 'Maths', coefficient: 3 })
  })

  it('affiche l\'état vide sans matière', () => {
    const w = mount(DashboardMatieresList, { props: { matieres: [] } })
    expect(w.find('.empty-state-inline').exists()).toBe(true)
  })
})

describe('DashboardClassesList (#H11)', () => {
  it('affiche les classes', () => {
    const w = mount(DashboardClassesList, {
      props: { classes: [{ id: 1, name: '6e A' }, { id: 2, name: '5e B' }] },
    })
    expect(w.findAll('.course-card')).toHaveLength(2)
  })
})

describe('DashboardEvaluationsList (#H11)', () => {
  it('affiche les évaluations avec date formatée', () => {
    const w = mount(DashboardEvaluationsList, {
      props: {
        evaluations: [{ id: 1, titre: 'Test', statut: 'planifie', date: '2024-01-01' }],
        formatDate: () => '1 janvier 2024',
      },
    })
    expect(w.find('.evaluation-title').text()).toBe('Test')
    expect(w.text()).toContain('1 janvier 2024')
  })
})

describe('DashboardQuickActions (#H11)', () => {
  it('affiche les 4 raccourcis', () => {
    const w = mount(DashboardQuickActions, { global: { stubs } })
    expect(w.findAll('.action-card')).toHaveLength(4)
  })
})
