/**
 * Test de RENDU du sous-composant ClassesStatsCards (#G1 ≤300).
 * Vérifie le montage et l'affichage des 4 compteurs depuis la prop stats.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClassesStatsCards from '@/components/admin/ClassesStatsCards.vue'

describe('ClassesStatsCards (#G1) — rendu', () => {
  it('monte et affiche les 4 cartes', () => {
    const w = mount(ClassesStatsCards, {
      props: { stats: { total: 5, totalEtudiants: 42, totalMatieres: 12, actives: 3 } }
    })
    expect(w.find('.stats-grid').exists()).toBe(true)
    expect(w.findAll('.stat-card')).toHaveLength(4)
  })

  it('affiche les valeurs des stats', () => {
    const w = mount(ClassesStatsCards, {
      props: { stats: { total: 5, totalEtudiants: 42, totalMatieres: 12, actives: 3 } }
    })
    const values = w.findAll('.stat-value').map(v => v.text())
    expect(values).toEqual(['5', '42', '12', '3'])
  })

  it('utilise des valeurs par défaut sans prop', () => {
    const w = mount(ClassesStatsCards)
    const values = w.findAll('.stat-value').map(v => v.text())
    expect(values).toEqual(['0', '0', '0', '0'])
  })
})
