/** Test de rendu InstitutionsStatsCards (#G1 ≤300) : 4 compteurs affichés. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import InstitutionsStatsCards from '@/components/admin/InstitutionsStatsCards.vue'

describe('InstitutionsStatsCards (#G1)', () => {
  it('affiche les 4 compteurs', () => {
    const w = mount(InstitutionsStatsCards, { props: { total: 3, active: 2, users: 50, content: 11 } })
    const cards = w.findAll('.stat-card')
    expect(cards).toHaveLength(4)
    expect(w.findAll('.stat-value').map(n => n.text())).toEqual(['3', '2', '50', '11'])
  })
})
