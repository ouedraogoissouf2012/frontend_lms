/** Test de rendu StatsMainGrid (#H3 ≤300) : 4 cartes larges, totaux et fallback 0. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import StatsMainGrid from '@/components/admin/StatsMainGrid.vue'

describe('StatsMainGrid (#H3)', () => {
  it('rend les 4 cartes larges avec leurs titres', () => {
    const w = mount(StatsMainGrid, { props: { stats: {} } })
    expect(w.findAll('.stat-card-large')).toHaveLength(4)
    expect(w.text()).toContain('Utilisateurs')
    expect(w.text()).toContain('Classes & Matières')
    expect(w.text()).toContain('Séances & Visioconférences')
    expect(w.text()).toContain('Évaluations')
  })

  it('calcule le total enseignants + étudiants', () => {
    const w = mount(StatsMainGrid, { props: { stats: { nb_enseignants: 3, nb_etudiants: 5 } } })
    expect(w.find('.stat-row.total .stat-value').text()).toBe('8')
  })

  it('affiche 0 par défaut pour les valeurs manquantes', () => {
    const w = mount(StatsMainGrid, { props: { stats: {} } })
    const values = w.findAll('.stat-value').map(v => v.text())
    expect(values.every(v => v === '0')).toBe(true)
  })
})
