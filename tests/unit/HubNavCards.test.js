/** Test de rendu HubNavCards (#H11 ≤300) : raccourcis avec compteurs. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import HubNavCards from '@/components/teacher/HubNavCards.vue'

const stubs = { RouterLink: { template: '<a><slot /></a>' } }
const stats = { classes: 5, matieres: 8, lecons: 12 }

describe('HubNavCards (#H11)', () => {
  it('sans capacite : classes/matieres/lecons, pas d import', () => {
    const w = mount(HubNavCards, {
      props: { stats },
      global: { stubs },
    })
    expect(w.findAll('.hub-card')).toHaveLength(3)
    expect(w.text()).not.toContain('Import apprenants')
    expect(w.findAll('.stat-number').map(n => n.text())).toEqual(['5', '8', '12'])
  })

  it('avec capacite : la carte import apparait', () => {
    const w = mount(HubNavCards, {
      props: { stats, peutInscrireLocalement: true },
      global: { stubs },
    })
    expect(w.findAll('.hub-card')).toHaveLength(4)
    expect(w.text()).toContain('Import apprenants')
  })
})
