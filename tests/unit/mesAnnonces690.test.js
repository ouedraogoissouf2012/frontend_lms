/**
 * #690 : la page « Mes annonces » (`/annonces`), pour tous les rôles d'une école. Elle lit les annonces de l'appelant
 * par `GET /notifications?type=annonce` (lms#1650, PR #1784). Le filtre est fait par le SERVEUR : filtrée à l'écran,
 * une page paginée perdrait les annonces des pages suivantes.
 *
 * Une annonce non lue est marquée lue à son ouverture (`POST /notifications/{id}/mark-as-read`). Une panne de lecture se
 * dit, avec « Réessayer » ; elle ne passe jamais pour « aucune annonce ». Ici le VRAI client HTTP.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import MesAnnonces from '@/views/annonces/MesAnnonces.vue'
import { academicRoutes } from '@/router/routes/academic.routes'
import { AUTHENTICATED_ROLES } from '@/router/routes/roleGroups'

let adaptateurOrigine
let requetes
let reponses

/** Une réponse par chemin (dernier segment significatif) ; `null` : pas de réponse. */
function brancher() {
  api.defaults.adapter = async (config) => {
    requetes.push({ method: config.method, url: config.url, params: config.params })
    const [status, data] = reponses(config)
    if (status === null) throw new AxiosError('timeout', AxiosError.ECONNABORTED, config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

const annonce = (id, titre, lue = false) => ({
  id, type: 'annonce', title: titre, message: `Texte de ${titre}.`, data: { annonce_id: id + 100 },
  read_at: lue ? '2026-11-27T08:00:00Z' : null, created_at: '2026-11-27T07:00:00Z',
})
const PAGE = (items, page = 1, last = 1) => ({ success: true, data: items, meta: { current_page: page, last_page: last, per_page: 20, total: items.length } })

const Fente = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })
const monter = async () => {
  const w = mount(MesAnnonces, { global: { stubs: { DashboardLayout: Fente } } })
  await flushPromises()
  return w
}

beforeEach(() => {
  // Le client HTTP lit la session (store) à chaque requête, comme en production.
  setActivePinia(createPinia())
  useAuthStore().user = { id: 1, name: 'Compte fictif', role: 'enseignant' }
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  reponses = () => [200, PAGE([annonce(1, 'Sortie au musée'), annonce(2, 'Réunion', true)])]
  brancher()
})

afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#690 — Mes annonces', () => {
  it('lit les annonces par le filtre du SERVEUR, et les montre', async () => {
    const w = await monter()

    expect(requetes[0]).toEqual({ method: 'get', url: '/notifications', params: { type: 'annonce', page: 1, per_page: 20 } })
    expect(w.text()).toContain('Sortie au musée')
    expect(w.text()).toContain('Réunion')
  })

  it('ouvrir une annonce non lue la marque lue ; une annonce déjà lue n’appelle rien', async () => {
    reponses = (config) => (config.method === 'post' ? [200, { success: true }] : [200, PAGE([annonce(1, 'Sortie au musée'), annonce(2, 'Réunion', true)])])
    const w = await monter()

    await w.find('[data-annonce="1"] [data-ouvrir]').trigger('click')
    await w.find('[data-annonce="2"] [data-ouvrir]').trigger('click')
    await flushPromises()

    const marques = requetes.filter((r) => r.method === 'post').map((r) => r.url)
    expect(marques).toEqual(['/notifications/1/mark-as-read'])
    expect(w.find('[data-annonce="1"]').text()).toContain('Texte de Sortie au musée.')
  })

  it('aucune annonce : l’état vide le dit', async () => {
    reponses = () => [200, PAGE([])]
    const w = await monter()

    expect(w.find('[data-etat="vide"]').exists()).toBe(true)
  })

  it('une panne n’est pas « aucune annonce » : elle se dit, avec « Réessayer »', async () => {
    reponses = () => [500, { success: false, message: 'Erreur' }]
    const w = await monter()

    expect(w.find('[data-etat="vide"]').exists()).toBe(false)
    expect(w.find('[role="alert"]').text()).not.toBe('')
    reponses = () => [200, PAGE([annonce(3, 'Après la panne')])]
    await w.find('[data-reessayer]').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Après la panne')
  })

  it('plusieurs pages : la suivante se lit au serveur', async () => {
    reponses = (config) => [200, config.params?.page === 2
      ? PAGE([annonce(5, 'Page deux')], 2, 2)
      : PAGE([annonce(4, 'Page une')], 1, 2)]
    const w = await monter()

    await w.find('[data-page-suivante]').trigger('click')
    await flushPromises()

    expect(requetes.at(-1).params).toEqual({ type: 'annonce', page: 2, per_page: 20 })
    expect(w.text()).toContain('Page deux')
  })

  it('la route /annonces est ouverte à tout compte d’école, sans le supradmin de plateforme', () => {
    const route = academicRoutes.find((r) => r.path === '/annonces')
    expect(route?.name).toBe('mes-annonces')
    expect(route.meta).toMatchObject({ requiresAuth: true, roles: AUTHENTICATED_ROLES })
  })
})
