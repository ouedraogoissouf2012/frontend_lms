/**
 * Faux vides (tournée en production du 30/10, compte supradmin ; E2E local) :
 *  - le Forum, refusé, affichait « Aucune discussion pour le moment » et proposait
 *    « Nouvelle discussion » : un refus se lisait comme un forum vide ;
 *  - Utilisateurs, avec `/admin/users` refusé, affichait « Aucun utilisateur n'a été
 *    trouvé » : l'échec de la source des comptes d'administration était muet.
 *
 * Le VRAI client HTTP (api.js et son intercepteur) ; seul l'adaptateur d'axios est
 * doublé. Refus recopiés des réponses VUES (403 `no_institution` en production).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {}, query: {} }) }))

import api from '@/services/api'
import Forum from '@/views/Forum.vue'
import AdminUsers from '@/views/admin/AdminUsers.vue'

const SANS_ETABLISSEMENT = { success: false, message: "Cet espace est réservé aux comptes d'un établissement.", reason: 'no_institution' }

let adaptateurOrigine
/** Chemins refusés (403) ; les autres reçoivent la réponse donnée, ou une liste vide. */
function servir({ refuses = [], reponses = {} } = {}) {
  api.defaults.adapter = async (config) => {
    if (refuses.some((c) => config.url.includes(c))) {
      const response = { status: 403, statusText: '', data: SANS_ETABLISSEMENT, headers: {}, config }
      throw new AxiosError('Request failed with status code 403', AxiosError.ERR_BAD_REQUEST, config, {}, response)
    }
    const cle = Object.keys(reponses).find((c) => config.url.includes(c))
    return { status: 200, statusText: 'OK', data: cle ? reponses[cle] : { success: true, data: [] }, headers: {}, config }
  }
}

const Coquille = { render() { return h('div', this.$slots.default?.()) } }

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => { api.defaults.adapter = adaptateurOrigine })

describe('Forum : un refus n\'est pas un forum vide', () => {
  const monterForum = async () => {
    const w = mount(Forum, { global: { stubs: { DashboardLayout: Coquille, Modal: true, BaseButton: true } } })
    await flushPromises()
    return w
  }

  it('refusé : le motif est dit, ni « Aucune discussion » ni « Nouvelle discussion »', async () => {
    servir({ refuses: ['/forum/topics'] })
    const w = await monterForum()
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.noInstitution)
    expect(w.text()).not.toMatch(/Aucune discussion/)
    expect(w.text()).not.toMatch(/Nouvelle discussion/)
  })

  it('lu et vide : « Aucune discussion » et le bouton de création', async () => {
    servir({ reponses: { '/forum/topics': { success: true, data: [] } } })
    const w = await monterForum()
    expect(w.text()).toMatch(/Aucune discussion pour le moment/)
    expect(w.text()).toMatch(/Nouvelle discussion/)
    expect(w.find('[role="alert"]').text()).toBe('')
  })
})

describe('Utilisateurs : l\'échec de l\'administration se dit, sans cacher le reste', () => {
  const monterUtilisateurs = async () => {
    const w = mount(AdminUsers, {
      global: { stubs: { DashboardLayout: Coquille, UserDetailModal: true, UsersStatsCards: true, UsersFilters: true, UsersTable: { props: ['filteredCount'], template: '<div class="table">{{ filteredCount }}</div>' } } },
    })
    await flushPromises()
    return w
  }

  it('tout refusé : pas de « Aucun utilisateur n\'a été trouvé », l\'échec de l\'administration est signalé', async () => {
    servir({ refuses: ['/proxy/classes', '/lms/enseignants', '/admin/users'] })
    const w = await monterUtilisateurs()
    expect(w.text()).not.toMatch(/Aucun utilisateur n'a été trouvé/)
    expect(w.text()).not.toMatch(/Aucun Utilisateur Trouvé/)
    expect(w.text()).toMatch(/comptes d'administration/)
  })

  it('administration refusée, enseignants chargés : les enseignants restent affichés', async () => {
    servir({
      refuses: ['/admin/users'],
      reponses: { '/lms/enseignants': { success: true, data: [{ id: 4, nom: 'Koné', prenom: 'Awa', email: 'a@e2e.test' }] } },
    })
    const w = await monterUtilisateurs()
    expect(w.find('.table').text()).toBe('1')
    expect(w.text()).toMatch(/comptes d'administration/)
  })
})
