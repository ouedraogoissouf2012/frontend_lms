/**
 * Trois écrans faux EN PERMANENCE : chacun lisait une forme de réponse que le
 * serveur ne rend pas. Les anciens tests simulaient la forme qu'attendait le CODE
 * (et non celle du serveur) : ils passaient au vert sur un écran toujours vide.
 *
 * Ici, la réponse traverse le VRAI client HTTP (api.js et son intercepteur, qui rend
 * le corps) et le VRAI service : seul l'adaptateur réseau d'axios est doublé, et
 * chaque corps recopie la forme émise par le serveur (source citée au-dessus).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

const klassciMock = vi.hoisted(() => ({
  getClasses: vi.fn(),
  getMatieres: vi.fn(),
  getEnseignants: vi.fn(),
}))
// Sources KLASSCI hors sujet : déjà des tableaux (déballés par klassciService).
vi.mock('@/services/klassci', () => ({ klassciService: klassciMock, default: klassciMock }))

import api from '@/services/api'
import { useAdminHub } from '@/composables/useAdminHub'
import { useCoordinatorSeances } from '@/composables/useCoordinatorSeances'
import { useClasseDetails } from '@/composables/useClasseDetails'

/** `GET /dashboard/stats` — DashboardAdminController::stats → successResponse(AdminDashboardService::aggregate). */
const STATS_ADMIN = {
  success: true,
  data: {
    users: { total: 50, students: 42, teachers: 8 },
    lessons: { total: 12, published: 9 },
    quizzes: { total: 7, total_attempts: 30 },
    forum: { total_topics: 3, total_posts: 11 },
    notifications: { total: 20, unread: 4 },
    recent_activity: { new_users: 2, new_lessons: 1, new_quiz_attempts: 5, new_forum_topics: 0 },
  },
}

/** `GET /lms/enseignants` — LMSEnseignantsController::getEnseignantsFromKlassci → successResponse(liste, '', 200, meta). */
const ENSEIGNANTS = {
  success: true,
  message: '',
  data: [{ id: 7, nom: 'Koné', prenom: 'Awa' }, { id: 9, nom: 'Traoré', prenom: 'Ali' }],
  meta: { source: 'klassci_externe', lms_cache_enabled: true, lms_performance: { total_time_ms: 12.5 } },
}

/** `GET /lms/seances/upcoming` — LMSSeancesListController::upcomingSeances : `data` EST la liste. */
const SEANCES_A_VENIR = {
  success: true,
  data: [{ id: 31, date_seance: '2026-11-02' }, { id: 32, date_seance: '2026-11-04' }],
  meta: { total_seances: 2, date_debut: '2026-10-30', date_fin: '2026-11-29', filtres: { teacher_id: null, classe_id: 5 } },
}

/** `GET /lms/classes/5` — détails d'une classe, roster inclus (ClasseDetailsQueryService). */
const DETAILS_CLASSE = {
  success: true,
  data: {
    classe: { id: 5, nom: '6e A' },
    etudiants: [{ id: 1 }],
    matieres_disponibles: [{ id: 7 }],
    evaluations: [],
    emploi_temps_semaine: [],
  },
}

let adaptateurOrigine
let requetes
/** Répond selon le chemin ; un chemin non prévu échoue bruyamment (404). */
function servir(routes) {
  api.defaults.adapter = async (config) => {
    requetes.push(config)
    const chemin = Object.keys(routes).find((c) => config.url.endsWith(c))
    if (!chemin) throw new Error(`requête non prévue par le test : ${config.url}`)
    return { status: 200, statusText: 'OK', data: routes[chemin], headers: {}, config }
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  klassciMock.getClasses.mockReset()
  klassciMock.getMatieres.mockReset()
  klassciMock.getEnseignants.mockReset()
  klassciMock.getClasses.mockResolvedValue([{ id: 1 }, { id: 2 }])
  klassciMock.getMatieres.mockResolvedValue([])
  klassciMock.getEnseignants.mockResolvedValue([])
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  vi.restoreAllMocks()
})

async function monter(composable, mocks) {
  let exposed
  mount(defineComponent({ setup() { exposed = composable(); return () => null } }), { global: { mocks } })
  await flushPromises()
  return exposed
}

describe('Accueil admin — les compteurs lus dans la réponse réelle de /dashboard/stats', () => {
  it('le nombre d’étudiants vient de data.users.students quand les classes ne le portent pas', async () => {
    servir({ '/dashboard/stats': STATS_ADMIN })
    const hub = await monter(useAdminHub)
    expect(hub.stats.value.etudiants).toBe(42)
  })

  it('séances et évaluations : le serveur n’en compte pas → null (« — »), jamais un 0 ni le nombre de quiz', async () => {
    servir({ '/dashboard/stats': STATS_ADMIN })
    const hub = await monter(useAdminHub)
    expect(hub.stats.value.seances).toBeNull()
    expect(hub.stats.value.evaluations).toBeNull()
  })

  it('statistiques en panne : séances et évaluations restent non mesurées', async () => {
    api.defaults.adapter = async () => { throw new Error('réseau coupé') }
    const hub = await monter(useAdminHub)
    expect(hub.stats.value.seances).toBeNull()
    expect(hub.stats.value.evaluations).toBeNull()
    expect(hub.error.value).toContain('statistiques')
  })
})

describe('Séances du coordinateur — la liste des enseignants n’est plus toujours vide', () => {
  it('remplit enseignants avec le tableau rendu par le service', async () => {
    servir({ '/lms/enseignants': ENSEIGNANTS })
    const c = useCoordinatorSeances()
    await c.loadEnseignants()
    expect(c.enseignants.value.map((e) => e.id)).toEqual([7, 9])
  })
})

describe('Détails d’une classe — les séances à venir ne sont plus toujours vides', () => {
  it('lit la liste dans data et interroge l’espace KLASSCI sur 30 jours', async () => {
    servir({ '/lms/classes/5': DETAILS_CLASSE, '/lms/seances/upcoming': SEANCES_A_VENIR })
    const d = await monter(useClasseDetails, { $route: { params: { id: '5' } }, $router: { push: vi.fn(), back: vi.fn() } })
    expect(d.seances.value.map((s) => s.id)).toEqual([31, 32])
    const appel = requetes.find((r) => r.url.endsWith('/lms/seances/upcoming'))
    expect(appel.params).toEqual({ classe_id: 5, days: 30 })
  })
})
