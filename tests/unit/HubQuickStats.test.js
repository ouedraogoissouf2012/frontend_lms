/** Test de rendu HubQuickStats (#H11 ≤300) : 3 compteurs de l'aperçu rapide. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import HubQuickStats from '@/components/teacher/HubQuickStats.vue'

describe('HubQuickStats (#H11)', () => {
  it('affiche séances à venir, évaluations et étudiants', () => {
    const w = mount(HubQuickStats, {
      props: { stats: { seancesAVenir: 3, evaluations: 2, etudiants: 41 } },
    })
    const cards = w.findAll('.stat-card')
    expect(cards).toHaveLength(3)
    expect(w.findAll('.stat-value').map(n => n.text())).toEqual(['3', '2', '41'])
  })
})
