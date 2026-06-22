/** Test de rendu EnseignantsStatsCards (#G1 ≤300) : 4 compteurs affichés dans l'ordre. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EnseignantsStatsCards from '@/components/admin/EnseignantsStatsCards.vue'

describe('EnseignantsStatsCards (#G1)', () => {
  it('affiche les 4 compteurs', () => {
    const w = mount(EnseignantsStatsCards, {
      props: { enseignants: 12, totalMatieres: 30, totalClasses: 18, actifs: 9 },
    })
    const cards = w.findAll('.stat-card')
    expect(cards).toHaveLength(4)
    expect(w.findAll('.stat-value').map(n => n.text())).toEqual(['12', '30', '18', '9'])
    expect(w.findAll('.stat-label').map(n => n.text())).toEqual([
      'Enseignants', 'Matières Assignées', 'Classes Assignées', 'Actifs',
    ])
  })
})
