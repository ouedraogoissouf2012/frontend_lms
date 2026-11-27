/**
 * #648 : le formulaire « Nouvel utilisateur » de `/admin/users` n'est offert QUE dans une école qui tient sa propre
 * liste (capacité `peutInscrireLocalement`, école autonome). En école KLASSCI, les comptes viennent de KLASSCI : aucun
 * geste. Une création (ou une création incertaine) fait RELIRE la liste.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const loadAllUsers = vi.fn()
vi.mock('@/composables/useAdminUsers', () => ({
  useAdminUsers: () => ({
    classes: ref([]), loading: ref(false), loadingProgress: ref(''), counts: ref({ etudiants: 0, enseignants: 0, classes: 0 }),
    notices: ref([]), selectedUser: ref(null), searchQuery: ref(''), filterRole: ref('all'), filterClasse: ref('all'),
    currentPage: ref(1), sortField: ref('name'), sortAsc: ref(true), filteredUsers: computed(() => []), totalPages: ref(1),
    paginatedUsers: computed(() => []), sortBy: vi.fn(), selectUser: vi.fn(), closeModal: vi.fn(), loadAllUsers, peutReessayer: () => false,
  }),
}))

import AdminUsers from '@/views/admin/AdminUsers.vue'

const Fente = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })
const CompteCreationFactice = defineComponent({ name: 'CompteCreation', emits: ['cree', 'incertain'], setup: () => () => h('form', { class: 'compte-creation' }) })

function monter(capacite) {
  useAuthStore().meta = { peut_inscrire_localement: capacite }
  return mount(AdminUsers, { global: { stubs: {
    DashboardLayout: Fente, CompteCreation: CompteCreationFactice,
    UsersStatsCards: true, UsersFilters: true, UsersTable: true, UserDetailModal: true,
  } } })
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().user = { id: 1, name: 'Admin fictif', role: 'admin' }
  loadAllUsers.mockClear()
})

describe('#648 — le formulaire suit la capacité de l’école', () => {
  it('école autonome (peutInscrireLocalement) : « Nouvel utilisateur » est offert', () => {
    expect(monter(true).findComponent({ name: 'CompteCreation' }).exists()).toBe(true)
  })

  it.each([[false], [undefined]])('capacité %s (école KLASSCI, ou méta absente) : aucun formulaire', (capacite) => {
    expect(monter(capacite).findComponent({ name: 'CompteCreation' }).exists()).toBe(false)
  })

  it.each([['cree'], ['incertain']])('`%s` : la liste est relue (rechargement forcé)', async (evenement) => {
    const w = monter(true)
    await w.findComponent({ name: 'CompteCreation' }).vm.$emit(evenement, {})
    expect(loadAllUsers).toHaveBeenCalledWith(true)
  })
})
