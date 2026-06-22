/**
 * Test de rendu InstitutionsTable (#G1 ≤300) : une ligne par institution, badge
 * de statut, repli date 'Aucune', et actions émises (edit/toggle/test). Le
 * spinner de test s'affiche selon testingId.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import InstitutionsTable from '@/components/admin/InstitutionsTable.vue'

const institutions = [
  {
    id: 1, slug: 'esbtp', name: 'ESBTP', klassci_api_url: 'https://x', primary_color: '#000', is_active: true,
    stats: { users_count: 10, lessons_count: 5, evaluations_count: 2, last_activity: null },
  },
  {
    id: 2, slug: 'iut', name: 'IUT', klassci_api_url: 'https://y', primary_color: '#111', is_active: false,
    stats: { users_count: 3, lessons_count: 1, evaluations_count: 0, last_activity: '2026-06-15' },
  },
]
const mountTable = (props = {}) => mount(InstitutionsTable, { props: { institutions, ...props } })

describe('InstitutionsTable (#G1)', () => {
  it('rend une ligne par institution avec statut', () => {
    const w = mountTable()
    expect(w.findAll('.table-row')).toHaveLength(2)
    expect(w.html()).toContain('ESBTP')
    expect(w.findAll('.status-badge').map(n => n.text())).toEqual(['Active', 'Inactive'])
  })

  it('replie une activité absente sur "Aucune"', () => {
    const w = mountTable()
    expect(w.html()).toContain('Aucune')
  })

  it('émet edit/toggle/test au clic sur les actions', async () => {
    const w = mountTable()
    const btns = w.find('.actions-cell').findAll('button')
    await btns[0].trigger('click')
    await btns[1].trigger('click')
    await btns[2].trigger('click')
    expect(w.emitted('edit')[0][0]).toMatchObject({ id: 1 })
    expect(w.emitted('toggle')[0][0]).toMatchObject({ id: 1 })
    expect(w.emitted('test')[0][0]).toMatchObject({ id: 1 })
  })

  it('désactive le bouton de test et montre le spinner pour testingId', () => {
    const w = mountTable({ testingId: 1 })
    const testBtn = w.find('.actions-cell .action-btn-blue')
    expect(testBtn.attributes('disabled')).toBeDefined()
    expect(testBtn.find('i').classes()).toContain('fa-spin')
  })
})
