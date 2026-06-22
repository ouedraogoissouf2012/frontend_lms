/** Test de rendu UsersFilters (#G1 ≤300) : v-model recherche/rôle/classe + options. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UsersFilters from '@/components/admin/UsersFilters.vue'

const mountFilters = (props = {}) =>
  mount(UsersFilters, {
    props: { search: '', role: 'all', classe: 'all', classes: [{ id: 1, nom: '6e A' }], ...props },
  })

describe('UsersFilters (#G1)', () => {
  it('rend les options de classes passées en prop', () => {
    const w = mountFilters()
    expect(w.html()).toContain('6e A')
    expect(w.findAll('select')).toHaveLength(2)
  })

  it('met à jour les v-model search et role', async () => {
    const w = mountFilters()
    await w.find('.search-input').setValue('marcel')
    expect(w.emitted('update:search')[0]).toEqual(['marcel'])
    await w.findAll('select')[0].setValue('etudiant')
    expect(w.emitted('update:role')[0]).toEqual(['etudiant'])
  })
})
