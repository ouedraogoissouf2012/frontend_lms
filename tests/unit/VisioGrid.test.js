/**
 * Test de rendu VisioGrid (#G1 ≤300) : une carte par visioconférence, badge de statut,
 * bouton "Rejoindre" seulement si actif, et émissions join/view.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import VisioGrid from '@/components/admin/VisioGrid.vue'

const visioconferences = [
  {
    id: 1, matiere: 'Maths', classe: '6e A', enseignant: 'Dupont Jean',
    date_debut: '2026-01-01T10:00:00', date_fin: '2026-01-01T11:00:00',
    status: 'active', room_name: 'room-1', participants_count: 5,
  },
  {
    id: 2, matiere: 'Histoire', classe: '5e B', enseignant: 'Martin Alice',
    date_debut: '2026-01-02T10:00:00', date_fin: '2026-01-02T11:00:00',
    status: 'scheduled', room_name: 'room-2', participants_count: 0,
  },
]

const mountGrid = (props = {}) =>
  mount(VisioGrid, {
    props: {
      visioconferences,
      getStatusLabel: (s) => ({ active: 'En cours', scheduled: 'Planifiée' }[s] || 'Inconnu'),
      formatDate: () => '1 janvier 2026',
      formatTime: () => '10:00',
      ...props,
    },
  })

describe('VisioGrid (#G1)', () => {
  it('rend une carte par visioconférence avec le libellé de statut', () => {
    const w = mountGrid()
    expect(w.findAll('.visio-card')).toHaveLength(2)
    expect(w.html()).toContain('Maths')
    expect(w.find('.status-badge').text()).toBe('En cours')
  })

  it('affiche "Rejoindre" uniquement pour les visios actives', () => {
    const w = mountGrid()
    const primaryBtns = w.findAll('.action-btn.primary')
    expect(primaryBtns).toHaveLength(1)
  })

  it('émet join au clic sur "Rejoindre"', async () => {
    const w = mountGrid()
    await w.find('.action-btn.primary').trigger('click')
    expect(w.emitted('join')[0][0]).toMatchObject({ id: 1 })
  })

  it('émet view au clic sur "Détails"', async () => {
    const w = mountGrid()
    await w.find('.action-btn.secondary').trigger('click')
    expect(w.emitted('view')[0][0]).toMatchObject({ id: 1 })
  })
})
