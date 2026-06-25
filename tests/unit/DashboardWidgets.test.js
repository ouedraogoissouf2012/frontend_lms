/**
 * Test de rendu DashboardWidgets (#G1) : profil (classe/filière/niveau),
 * widgets performance/activité, notes récentes et les 4 actions rapides.
 */
import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DashboardWidgets from '@/components/student/DashboardWidgets.vue'

const DATA = {
  classe: { name: '6e A', filiere: { name: 'Scientifique' }, niveau: { name: 'Collège' } },
  statistiques: { moyenne_generale: 14.5, taux_presence: 92 },
  cours: [{}, {}],
  quiz: [{}],
  notes: [
    { id: 1, evaluation: { titre: 'Devoir 1' }, matiere: { name: 'Maths' }, note: 16 },
  ],
}

const mountWidgets = (dashboardData = DATA) =>
  mount(DashboardWidgets, {
    props: { dashboardData },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })

describe('DashboardWidgets (#G1)', () => {
  it('rend le profil (classe / filière / niveau)', () => {
    const w = mountWidgets()
    const t = w.text()
    expect(t).toContain('6e A')
    expect(t).toContain('Scientifique')
    expect(t).toContain('Collège')
  })

  it('rend les statistiques de performance et activité', () => {
    const w = mountWidgets()
    const t = w.text()
    expect(t).toContain('14.5')   // moyenne générale
    expect(t).toContain('92%')    // taux de présence
    expect(t).toContain('Cours Suivis')
  })

  it('rend les notes récentes', () => {
    const w = mountWidgets()
    const t = w.text()
    expect(t).toContain('Devoir 1')
    expect(t).toContain('Maths')
    expect(t).toContain('16/20')
  })

  it('rend les 4 actions rapides', () => {
    const w = mountWidgets()
    expect(w.findAll('.action-card')).toHaveLength(4)
  })

  it('affiche un fallback quand aucune classe', () => {
    const w = mountWidgets({ ...DATA, classe: null })
    expect(w.text()).toContain('Aucune classe assignée')
  })
})
