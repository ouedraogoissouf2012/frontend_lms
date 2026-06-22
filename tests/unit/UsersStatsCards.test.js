/** Test de rendu UsersStatsCards (#G1 ≤300) : 4 compteurs affichés. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UsersStatsCards from '@/components/admin/UsersStatsCards.vue'

describe('UsersStatsCards (#G1)', () => {
  it('affiche les 4 compteurs', () => {
    const w = mount(UsersStatsCards, { props: { total: 42, etudiants: 30, enseignants: 10, classes: 5 } })
    const cards = w.findAll('.stat-card')
    expect(cards).toHaveLength(4)
    expect(w.findAll('.stat-value').map(n => n.text())).toEqual(['42', '30', '10', '5'])
  })
})
