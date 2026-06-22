/**
 * Test de rendu UsersTable (#G1 ≤300) : lignes, badge/label de rôle, tri (emit sort),
 * sélection (emit select) et pagination (v-model currentPage).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UsersTable from '@/components/admin/UsersTable.vue'

const users = [
  { _uid: 'etu-1', name: 'Marcel', email: 'm@e.com', role: 'etudiant', classe_nom: '6e A' },
  { _uid: 'ens-2', name: 'Prof', email: 'p@e.com', role: 'enseignant', classe_nom: null },
]
const mountTable = (props = {}) =>
  mount(UsersTable, {
    props: { users, sortField: 'name', sortAsc: true, totalPages: 3, currentPage: 1, filteredCount: 60, ...props },
  })

describe('UsersTable (#G1)', () => {
  it('rend une ligne par utilisateur avec libellé de rôle', () => {
    const w = mountTable()
    expect(w.findAll('.user-row')).toHaveLength(2)
    expect(w.html()).toContain('Marcel')
    expect(w.find('.role-badge').text()).toBe('Étudiant')
  })

  it('émet sort au clic sur un en-tête triable', async () => {
    const w = mountTable()
    await w.findAll('th.sortable')[1].trigger('click')
    expect(w.emitted('sort')[0]).toEqual(['email'])
  })

  it('émet select au clic sur une ligne', async () => {
    const w = mountTable()
    await w.find('.user-row').trigger('click')
    expect(w.emitted('select')[0][0]).toMatchObject({ _uid: 'etu-1' })
  })

  it('met à jour currentPage via la pagination', async () => {
    const w = mountTable({ currentPage: 2 })
    await w.findAll('.page-btn')[1].trigger('click') // précédent
    expect(w.emitted('update:currentPage')[0]).toEqual([1])
  })
})
