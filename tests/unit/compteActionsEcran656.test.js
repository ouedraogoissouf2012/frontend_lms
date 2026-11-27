/**
 * #656, lot (b) : sur `/admin/users`, la fiche d'un compte porte ses actions (`CompteActions`). Une modification ou
 * une désactivation ferme la fiche et RELIT la liste ; un acte incertain la relit aussi. Un mot de passe défini ne
 * change rien à la liste : la fiche reste ouverte, sur son annonce.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const loadAllUsers = vi.fn()
const closeModal = vi.fn()
const LIGNE = { _uid: 'etu-101', lms_id: 101, name: 'Bruno Fictif', role: 'etudiant', role_brut: 'etudiant' }

vi.mock('@/composables/useAdminUsers', () => ({
  useAdminUsers: () => ({
    classes: ref([]), loading: ref(false), loadingProgress: ref(''), counts: ref({ etudiants: 0, enseignants: 0, classes: 0 }),
    notices: ref([]), selectedUser: ref(LIGNE), searchQuery: ref(''), filterRole: ref('all'), filterClasse: ref('all'),
    currentPage: ref(1), sortField: ref('name'), sortAsc: ref(true), filteredUsers: computed(() => []), totalPages: ref(1),
    paginatedUsers: computed(() => []), sortBy: vi.fn(), selectUser: vi.fn(), closeModal, loadAllUsers, peutReessayer: () => false,
  }),
}))

import AdminUsers from '@/views/admin/AdminUsers.vue'

const Fente = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })
const CompteActionsFactice = defineComponent({
  name: 'CompteActions', props: { ligne: { type: Object, default: null } }, emits: ['fait', 'incertain'],
  setup: () => () => h('div', { class: 'compte-actions-factice' }),
})

function monter() {
  return mount(AdminUsers, { global: { stubs: {
    DashboardLayout: Fente, CompteActions: CompteActionsFactice, CompteCreation: true,
    UsersStatsCards: true, UsersFilters: true, UsersTable: true, teleport: true,
  } } })
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().user = { id: 1, name: 'Admin fictif', role: 'admin' }
  useAuthStore().meta = { peut_inscrire_localement: true }
  loadAllUsers.mockClear()
  closeModal.mockClear()
})

describe('#656 (b) — les actions dans la fiche', () => {
  it('la fiche ouverte porte les actions de SA ligne', () => {
    const actions = monter().findComponent({ name: 'CompteActions' })
    expect(actions.exists()).toBe(true)
    expect(actions.props('ligne')).toEqual(LIGNE)
  })

  it.each([['modifie'], ['desactive']])('`fait` (%s) : la fiche se ferme et la liste est relue', async (acte) => {
    const w = monter()
    await w.findComponent({ name: 'CompteActions' }).vm.$emit('fait', { acte })
    expect(closeModal).toHaveBeenCalled()
    expect(loadAllUsers).toHaveBeenCalledWith(true)
  })

  it('`incertain` : la liste est relue', async () => {
    const w = monter()
    await w.findComponent({ name: 'CompteActions' }).vm.$emit('incertain')
    expect(loadAllUsers).toHaveBeenCalledWith(true)
  })

  it('un mot de passe défini : la fiche reste ouverte, la liste n’est pas relue', async () => {
    const w = monter()
    await w.findComponent({ name: 'CompteActions' }).vm.$emit('fait', { acte: 'mot_de_passe' })
    expect(closeModal).not.toHaveBeenCalled()
    expect(loadAllUsers).not.toHaveBeenCalled()
  })
})
