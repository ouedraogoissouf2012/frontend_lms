/** Test de rendu DashboardStatsCards (#H3 ≤300) : 4 cartes KPI et fallback 0. */
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards.vue'

// Les valeurs sont animées (count-up). Sous « mouvement réduit », le composable
// pose la valeur finale dès le 1er rendu → assertions synchrones déterministes.
const originalMatchMedia = window.matchMedia
beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: true, media: '', addEventListener() {}, removeEventListener() {},
  }))
})
afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('DashboardStatsCards (#H3)', () => {
  it('rend les 4 cartes KPI avec leurs libellés', () => {
    const w = mount(DashboardStatsCards, { props: { stats: {} } })
    expect(w.findAll('.stat-card')).toHaveLength(4)
    expect(w.text()).toContain('Enseignants')
    expect(w.text()).toContain('Étudiants')
    expect(w.text()).toContain('Classes actives')
    expect(w.text()).toContain('Matières')
  })

  it('affiche les valeurs fournies', () => {
    const w = mount(DashboardStatsCards, {
      props: { stats: { nb_enseignants: 7, nb_etudiants: 42, nb_classes_actives: 3, nb_matieres_actives: 9 } },
    })
    const values = w.findAll('.stat-value').map(v => v.text())
    expect(values).toEqual(['7', '42', '3', '9'])
  })
  // Le cas « valeurs manquantes » (→ « — », plus « 0 ») est couvert exhaustivement
  // par DashboardStatsCardsMeasured.test.js (mesuré vs non mesuré).
})
