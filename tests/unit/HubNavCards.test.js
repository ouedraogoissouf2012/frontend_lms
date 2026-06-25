/** Test de rendu HubNavCards (#H11 ≤300) : 3 raccourcis avec leurs compteurs. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import HubNavCards from '@/components/teacher/HubNavCards.vue'

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

describe('HubNavCards (#H11)', () => {
  it('affiche les 3 cartes avec les compteurs classes/matières/leçons', () => {
    const w = mount(HubNavCards, {
      props: { stats: { classes: 5, matieres: 8, lecons: 12 } },
      global: { stubs },
    })
    const cards = w.findAll('.hub-card')
    expect(cards).toHaveLength(3)
    expect(w.findAll('.stat-number').map(n => n.text())).toEqual(['5', '8', '12'])
  })
})
