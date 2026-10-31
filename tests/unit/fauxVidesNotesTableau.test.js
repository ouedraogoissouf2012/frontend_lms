/**
 * Faux vides, suite (E2E local du 30/10, A-E24 ; production, compte supradmin) :
 *  - Mes notes, refusées (401 `klassci_token_missing`), affichaient « MOYENNE
 *    GÉNÉRALE 0/20 · 0 évaluations · 0 % » au-dessus du message d'erreur, et le
 *    message lisait le texte du serveur ;
 *  - le tableau de bord générique `/dashboard` affichait « 0 / 0 / 0 % » et
 *    « Aucune leçon disponible » sous un refus, le premier échec arrêtant tout.
 *
 * Le VRAI client HTTP (api.js et son intercepteur) ; seul l'adaptateur d'axios est
 * doublé. Refus recopiés des réponses VUES.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const utilisateur = vi.hoisted(() => ({ courant: null }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {}, query: {} }) }))
vi.mock('@/services/api', async (importOriginal) => {
  const reel = await importOriginal()
  return { ...reel, auth: { ...reel.auth, getUser: () => utilisateur.courant } }
})

import api from '@/services/api'
import StudentGrades from '@/views/student/StudentGrades.vue'
import Dashboard from '@/views/Dashboard.vue'

const REFUS = {
  401: { success: false, message: "Aucun accès KLASSCI n'est enregistré pour ce compte : ces données, qui proviennent de KLASSCI, ne peuvent pas être affichées.", reason: 'klassci_token_missing' },
  403: { success: false, message: "Cet espace est réservé aux comptes d'un établissement.", reason: 'no_institution' },
}

let adaptateurOrigine
/** `refuses` : { chemin: statut } ; les autres chemins reçoivent la réponse donnée, ou une liste vide. */
function servir({ refuses = {}, reponses = {} } = {}) {
  api.defaults.adapter = async (config) => {
    const refuse = Object.keys(refuses).find((c) => config.url.includes(c))
    if (refuse) {
      const statut = refuses[refuse]
      const response = { status: statut, statusText: '', data: REFUS[statut], headers: {}, config }
      throw new AxiosError(`Request failed with status code ${statut}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
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

describe('Mes notes : un refus n\'est pas une moyenne de 0/20', () => {
  const monter = async () => {
    const w = mount(StudentGrades, {
      global: { stubs: { DashboardLayout: Coquille, GradesFilters: true, GradesSummary: true, GradesTable: true, ContentLoader: true } },
    })
    await flushPromises()
    return w
  }

  it('refusées : aucune carte « 0/20 », le motif du catalogue (jamais le texte du serveur)', async () => {
    servir({ refuses: { '/my-grades': 401 } })
    const w = await monter()
    expect(w.text()).not.toMatch(/0\/20/)
    expect(w.find('.stats-cards').exists()).toBe(false)
    expect(w.find('.error-text').text()).toBe(ERROR_MESSAGES.klassciTokenMissing)
  })

  it('lues : les cartes de synthèse s\'affichent', async () => {
    servir({ reponses: { '/my-grades': { success: true, data: { matieres: [], moyenne_generale: 12, total_matieres: 1, total_evaluations: 2 } } } })
    const w = await monter()
    expect(w.find('.stats-cards').exists()).toBe(true)
    expect(w.text()).toMatch(/12\/20/)
  })
})

describe('Tableau de bord générique : « — » et motif sous un refus', () => {
  const monter = async () => {
    const w = mount(Dashboard, { global: { stubs: { DashboardLayout: Coquille, ContentLoader: true } } })
    await flushPromises()
    return w
  }

  it('compte sans tableau de bord, leçons refusées : « — », motif dit, pas de « Aucune leçon disponible »', async () => {
    utilisateur.courant = { name: 'Supradmin', role: 'supradmin' }
    servir({ refuses: { '/lessons': 403 } })
    const w = await monter()
    expect(w.text()).not.toMatch(/(^|\D)0%/)
    expect(w.findAll('.sr-only').map((s) => s.text())).toContain('non disponible')
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.noInstitution)
    expect(w.text()).not.toMatch(/Aucune leçon disponible/)
  })

  it('élève, tableau de bord lu : les compteurs mesurés s\'affichent, même 0', async () => {
    utilisateur.courant = { name: 'Eleve', role: 'etudiant' }
    servir({ reponses: { '/dashboard/student': { lessons_in_progress: 3, quizzes_completed: 0, overall_progress: 40 } } })
    const w = await monter()
    expect(w.text()).toMatch(/40%/)
    expect(w.findAll('.grid .text-3xl').map((p) => p.text())).toEqual(['3', '0', '40%'])
  })
})
