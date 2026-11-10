/**
 * /admin/users : le total des utilisateurs n'est donné que si CHAQUE population est mesurée.
 *
 * Revue indépendante de #505 : `measuredTotal` faisait `(etudiants ?? 0) + (enseignants ?? 0)`.
 * L'effectif étudiant non mesuré (une classe sans effectif suffit désormais) affichait donc le
 * total des seuls enseignants comme le total des utilisateurs.
 */
import { shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const counts = vi.hoisted(() => ({ value: null }))
vi.mock('@/composables/useAdminUsers', async () => {
  const { ref: r, computed: c } = await import('vue')
  return {
    useAdminUsers: () => ({
      classes: r([]), loading: r(false), loadingProgress: r(0), counts: c(() => counts.value), notices: r([]),
      selectedUser: r(null), searchQuery: r(''), filterRole: r(''), filterClasse: r(''), currentPage: r(1),
      sortField: r('name'), sortAsc: r(true), filteredUsers: r([]), totalPages: r(1), paginatedUsers: r([]),
      sortBy: vi.fn(), selectUser: vi.fn(), closeModal: vi.fn(), loadAllUsers: vi.fn(),
    }),
  }
})

import AdminUsers from '@/views/admin/AdminUsers.vue'
import UsersStatsCards from '@/components/admin/UsersStatsCards.vue'

const total = (c) => {
  counts.value = c
  const w = shallowMount(AdminUsers, { global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' } } } })
  return w.findComponent(UsersStatsCards).props('total')
}

describe('/admin/users — total des utilisateurs', () => {
  it('les deux populations mesurées → la somme', () => {
    expect(total({ etudiants: 6, enseignants: 2, classes: 2 })).toBe(8)
  })

  it('une population non mesurée → non mesuré, jamais l’autre seule', () => {
    expect(total({ etudiants: null, enseignants: 2, classes: 2 })).toBeNull()
    expect(total({ etudiants: 6, enseignants: null, classes: 2 })).toBeNull()
  })
})
