/**
 * Faux zéros de l'admin (E2E local du 30/10, A-E2 ; production, compte supradmin) :
 * sous un refus, le Hub affichait « 0 classe(s) », Matières « 0 matière(s) · 0h »,
 * Enseignants et Visioconférences quatre compteurs à 0. Une source refusée n'est
 * pas une école vide : le compteur doit dire « — » (« non disponible »).
 *
 * Les composables passent par le VRAI client HTTP (api.js et son intercepteur) ;
 * seul l'adaptateur réseau d'axios est doublé. Refus recopiés des réponses VUES
 * (401 `klassci_token_missing` sur le banc local).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {} }) }))

import api from '@/services/api'
import CountValue from '@/components/common/CountValue.vue'
import HubCard from '@/components/admin/HubCard.vue'
import EnseignantsStatsCards from '@/components/admin/EnseignantsStatsCards.vue'
import VisioStatsCards from '@/components/admin/VisioStatsCards.vue'
import AdminMatieres from '@/views/admin/AdminMatieres.vue'
import { useAdminHub } from '@/composables/useAdminHub'
import { useAdminEnseignants } from '@/composables/useAdminEnseignants'
import { useAdminVisio } from '@/composables/useAdminVisio'

const SANS_ACCES_KLASSCI = {
  status: 401,
  data: { success: false, message: "Aucun accès KLASSCI n'est enregistré pour ce compte.", reason: 'klassci_token_missing' },
}

let adaptateurOrigine
/** Chemins refusés ; les autres reçoivent la réponse donnée, ou une liste vide. */
function servir({ refuses = [], reponses = {} } = {}) {
  api.defaults.adapter = async (config) => {
    if (refuses.some((c) => config.url.includes(c))) {
      const response = { status: 401, statusText: '', data: SANS_ACCES_KLASSCI.data, headers: {}, config }
      throw new AxiosError('Request failed with status code 401', AxiosError.ERR_BAD_REQUEST, config, {}, response)
    }
    const cle = Object.keys(reponses).find((c) => config.url.includes(c))
    return { status: 200, statusText: 'OK', data: cle ? reponses[cle] : { success: true, data: [] }, headers: {}, config }
  }
}

async function monter(composable) {
  let exposed
  mount(defineComponent({ setup() { exposed = composable(); return () => null } }))
  await flushPromises()
  return exposed
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => { api.defaults.adapter = adaptateurOrigine })

describe('CountValue : un compteur qui ne se fabrique pas', () => {
  it('« — » à l\'œil et « non disponible » au lecteur d\'écran quand la valeur n\'est pas mesurée', () => {
    const w = mount(CountValue, { props: { value: null } })
    expect(w.text()).toBe('—non disponible')
    expect(w.find('[aria-hidden="true"]').text()).toBe('—')
    expect(w.find('.sr-only').text()).toBe('non disponible')
  })

  it('un zéro MESURÉ reste 0, sans mention « non disponible »', () => {
    const w = mount(CountValue, { props: { value: 0 } })
    expect(w.text()).toBe('0')
    expect(w.find('.sr-only').exists()).toBe(false)
  })
})

describe('Hub : une source refusée n\'affiche plus « 0 »', () => {
  it('la carte rend « — » pour un compteur non mesuré', () => {
    const w = mount(HubCard, {
      props: { to: '/admin/classes', icon: () => null, title: 'Classes', stat: null, statLabel: 'classe(s)' },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    expect(w.find('.stat-number').text()).toBe('—non disponible')
  })

  it('classes refusées : compteur `null`, bandeau d\'avertissement gardé, autres sources mesurées', async () => {
    servir({ refuses: ['/proxy/classes'], reponses: { '/proxy/matieres': { success: true, data: [{ id: 1 }, { id: 2 }] } } })
    const hub = await monter(useAdminHub)
    expect(hub.stats.value.classes).toBe(null)
    expect(hub.stats.value.matieres).toBe(2)
    expect(hub.error.value).toMatch(/classes/)
  })
})

describe('Matières : pas de « 0 matière(s) · 0h » sous un refus', () => {
  it('catalogue refusé et jamais chargé : le sous-titre des totaux n\'est pas rendu', async () => {
    servir({ refuses: ['/admin/matieres', '/proxy/structure'] })
    const w = mount(AdminMatieres, {
      global: {
        stubs: {
          DashboardLayout: { render() { return h('div', this.$slots.default?.()) } },
          MatiereModals: true, MatieresFilters: true, MatieresTable: true, ContentLoader: true,
        },
      },
    })
    await flushPromises()
    expect(w.text()).not.toMatch(/matière\(s\)/)
    expect(w.find('.page-subtitle').exists()).toBe(false)
  })
})

describe('Enseignants : quatre compteurs « — » sous un refus', () => {
  it('liste refusée et jamais chargée : compteurs `null`', async () => {
    servir({ refuses: ['/lms/enseignants', '/proxy/enseignants'] })
    const e = await monter(useAdminEnseignants)
    expect(e.nbEnseignants.value).toBe(null)
    expect(e.totalMatieres.value).toBe(null)
    expect(e.totalClasses.value).toBe(null)
    expect(e.enseignantsActifs.value).toBe(null)
  })

  it('les cartes rendent « — », jamais 0', () => {
    const w = mount(EnseignantsStatsCards, { props: { enseignants: null, totalMatieres: null, totalClasses: null, actifs: null } })
    const valeurs = w.findAll('.stat-value').map((v) => v.text())
    expect(valeurs).toEqual(Array(4).fill('—non disponible'))
  })
})

describe('Visioconférences : quatre compteurs « — » sous un refus', () => {
  it('séances refusées : compteurs `null`', async () => {
    servir({ refuses: ['/lms/seances/upcoming'] })
    const v = await monter(useAdminVisio)
    expect(v.stats.value).toEqual({ active: null, scheduled: null, completed: null, total: null })
  })

  it('séances lues (même vides) : compteurs mesurés à 0', async () => {
    servir({ reponses: { '/lms/seances/upcoming': { success: true, data: [] } } })
    const v = await monter(useAdminVisio)
    expect(v.stats.value).toEqual({ active: 0, scheduled: 0, completed: 0, total: 0 })
  })

  it('les cartes rendent « — », jamais 0', () => {
    const w = mount(VisioStatsCards, { props: { stats: { active: null, scheduled: null, completed: null, total: null } } })
    const valeurs = w.findAll('.stat-value').map((v) => v.text())
    expect(valeurs).toEqual(Array(4).fill('—non disponible'))
  })
})
