/**
 * Test de rendu UsersStatsCards (#G1 ≤300) : 4 compteurs affichés.
 *
 * Distinction MESURÉ / NON MESURÉ : le défaut `0` faisait passer une panne de
 * chargement pour un comptage nul — l'écran annonçait « 0 Étudiants » alors
 * qu'aucun appel n'avait abouti.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UsersStatsCards from '@/components/admin/UsersStatsCards.vue'

const values = (w) => w.findAll('.stat-value').map(n => n.text())

describe('UsersStatsCards (#G1)', () => {
  it('affiche les 4 compteurs mesurés', () => {
    const w = mount(UsersStatsCards, { props: { total: 42, etudiants: 30, enseignants: 10, classes: 5 } })
    expect(w.findAll('.stat-card')).toHaveLength(4)
    expect(values(w)).toEqual(['42', '30', '10', '5'])
  })

  it('rend « 0 » pour un comptage RÉELLEMENT nul', () => {
    const w = mount(UsersStatsCards, { props: { total: 0, etudiants: 0, enseignants: 0, classes: 0 } })
    expect(values(w)).toEqual(['0', '0', '0', '0'])
  })

  it('rend « — » pour une valeur NON mesurée, jamais un zéro fabriqué', () => {
    const w = mount(UsersStatsCards, {
      props: { total: 6, etudiants: null, enseignants: 6, classes: 17 },
    })
    expect(values(w)).toEqual(['6', '—', '6', '17'])
  })

  it('rend « — » partout sans aucune prop', () => {
    const w = mount(UsersStatsCards)
    expect(values(w)).toEqual(['—', '—', '—', '—'])
  })
})
