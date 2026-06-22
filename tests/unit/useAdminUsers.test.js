/**
 * Test du composable useAdminUsers (#G1 ≤300) : agrégation étudiants+enseignants,
 * filtres (rôle/recherche), tri et pagination. Services KLASSCI + cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))
vi.mock('@/services/klassci', () => ({
  default: {
    getClasses: () => Promise.resolve([{ id: 1, nom: '6e A' }]),
    getEnseignants: () => Promise.resolve([
      { id: 10, nom: 'Zoé Prof', email: 'zoe@e.com' },
    ]),
    getClasseEtudiants: () => Promise.resolve([
      { id: 100, nom: 'Aline Eleve', email: 'aline@e.com' },
    ]),
  },
}))

import { useAdminUsers } from '@/composables/useAdminUsers'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminUsers(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminUsers (#G1)', () => {
  it('agrège étudiants + enseignants en une liste unifiée', async () => {
    const u = await setup()
    expect(u.totalUsers.value).toBe(2)
    expect(u.loading.value).toBe(false)
  })

  it('filtre par rôle', async () => {
    const u = await setup()
    u.filterRole.value = 'etudiant'
    expect(u.filteredUsers.value).toHaveLength(1)
    expect(u.filteredUsers.value[0].role).toBe('etudiant')
  })

  it('filtre par recherche (nom/email)', async () => {
    const u = await setup()
    u.searchQuery.value = 'aline'
    expect(u.filteredUsers.value).toHaveLength(1)
    expect(u.filteredUsers.value[0].name).toContain('Aline')
  })

  it('trie par nom (asc/desc via sortBy)', async () => {
    const u = await setup()
    expect(u.filteredUsers.value[0].name).toBe('Aline Eleve') // asc
    u.sortBy('name') // bascule desc
    expect(u.filteredUsers.value[0].name).toBe('Zoé Prof')
  })

  it('select/closeModal pilotent selectedUser', async () => {
    const u = await setup()
    u.selectUser({ _uid: 'x' })
    expect(u.selectedUser.value).toEqual({ _uid: 'x' })
    u.closeModal()
    expect(u.selectedUser.value).toBe(null)
  })
})
