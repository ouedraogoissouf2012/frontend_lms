/**
 * Messages bruts (E2E local du 30/10, A-E2 et A-E23) : trois écrans montraient à
 * l'utilisateur le texte technique d'axios (« Request failed with status code 401 »),
 * le texte du serveur, ou « Session expirée » sur un refus qui n'a rien d'une
 * session expirée.
 *
 * La réponse traverse le VRAI client HTTP (api.js et son intercepteur, qui pose
 * `userMessage`) et les VRAIS services : seul l'adaptateur réseau d'axios est doublé.
 * Les corps recopient les réponses VUES sur le banc local (bilan E2E, A-E1/A-E23) et
 * en production (refus `no_institution`).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }), useRoute: () => ({ params: {} }) }))

// Seul `auth.getUser` est doublé (élève connecté) ; le client `api` reste le vrai.
vi.mock('@/services/api', async (importOriginal) => {
  const reel = await importOriginal()
  return { ...reel, auth: { ...reel.auth, getUser: () => ({ id: 14, role: 'etudiant' }) } }
})

const toastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  toast: { error: (...a) => toastError(...a), success: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))
vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({ confirm: () => Promise.resolve(true) }),
}))

import api from '@/services/api'
import { useStudentEvaluationsList } from '@/composables/useStudentEvaluationsList'
import { useAdminVisio } from '@/composables/useAdminVisio'
import { useSeanceAttendanceHistory } from '@/composables/useSeanceAttendanceHistory'

/** 401 d'une route adossée à KLASSCI pour un compte sans accès KLASSCI (VU, A-E23). */
const SANS_ACCES_KLASSCI = {
  status: 401,
  data: {
    success: false,
    message: "Aucun accès KLASSCI n'est enregistré pour ce compte : ces données, qui proviennent de KLASSCI, ne peuvent pas être affichées.",
    reason: 'klassci_token_missing',
  },
}
/** 403 d'une route d'école pour un compte sans établissement (VU en production). */
const SANS_ETABLISSEMENT = {
  status: 403,
  data: { success: false, message: "Cet espace est réservé aux comptes d'un établissement.", reason: 'no_institution' },
}
/** 500 dont le corps porte un texte technique : il ne doit JAMAIS atteindre l'écran. */
const PANNE = { status: 500, data: { success: false, message: 'SQLSTATE[42S22]: Column not found: 1054' } }

const BRUT = /Request failed|status code|SQLSTATE/

let adaptateurOrigine
/** Chaque requête reçoit la réponse prévue pour son chemin ; un 2xx est servi tel quel. */
function servir(routes) {
  api.defaults.adapter = async (config) => {
    const chemin = Object.keys(routes).find((c) => config.url.includes(c))
    if (!chemin) throw new Error(`requête non prévue par le test : ${config.url}`)
    const r = routes[chemin]
    const response = { status: r.status, statusText: '', data: r.data, headers: {}, config }
    if (r.status >= 400) {
      // Message EXACT d'axios : c'est lui que les écrans affichaient.
      throw new AxiosError(`Request failed with status code ${r.status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
    }
    return response
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
  toastError.mockReset()
  push.mockReset()
})
afterEach(() => { api.defaults.adapter = adaptateurOrigine })

describe('Mes évaluations (élève) : le motif du serveur, jamais « Session expirée » à tort', () => {
  it('un 401 klassci_token_missing dit « aucun accès KLASSCI », pas « Session expirée »', async () => {
    servir({ '/evaluations/student': SANS_ACCES_KLASSCI })
    const u = await monter(useStudentEvaluationsList)
    expect(u.error.value).toBe(ERROR_MESSAGES.klassciTokenMissing)
    expect(u.error.value).not.toMatch(/Session expirée/)
    expect(u.loading.value).toBe(false)
  })

  it('une panne serveur dit le message du catalogue, jamais le texte du serveur', async () => {
    servir({ '/evaluations/student': PANNE })
    const u = await monter(useStudentEvaluationsList)
    expect(u.error.value).toBe(ERROR_MESSAGES.server)
    expect(u.error.value).not.toMatch(BRUT)
  })
})

describe('Visioconférences (admin) : plus de « Request failed with status code »', () => {
  it('un 401 klassci_token_missing dit le motif du catalogue', async () => {
    servir({ '/lms/seances/upcoming': SANS_ACCES_KLASSCI })
    const v = await monter(useAdminVisio)
    expect(v.error.value).toBe(ERROR_MESSAGES.klassciTokenMissing)
    expect(v.error.value).not.toMatch(BRUT)
  })

  it('un refus sans établissement dit le message du catalogue', async () => {
    servir({ '/lms/seances/upcoming': SANS_ETABLISSEMENT })
    const v = await monter(useAdminVisio)
    expect(v.error.value).toBe(ERROR_MESSAGES.noInstitution)
  })

  it('une réponse sans succès ne montre pas le texte du serveur', async () => {
    servir({ '/lms/seances/upcoming': { status: 200, data: { success: false, message: 'Erreur interne : table seances verrouillée' } } })
    const v = await monter(useAdminVisio)
    expect(v.error.value).toBe(ERROR_MESSAGES.unknown)
    expect(v.error.value).not.toMatch(/table seances/)
  })
})

describe('Historique des présences : plus de « Request failed with status code »', () => {
  const SEANCES = { status: 200, data: { success: true, data: [{ id: 3, klassci_seance_id: 'S3' }], pagination: { current_page: 1, last_page: 1 } } }

  it('la liste des séances refusée dit le motif du catalogue', async () => {
    servir({ '/lms/seances/history': SANS_ACCES_KLASSCI })
    const h = await monter(useSeanceAttendanceHistory)
    expect(h.error.value).toBe(ERROR_MESSAGES.klassciTokenMissing)
    expect(h.error.value).not.toMatch(BRUT)
  })

  it('les présences d\'une séance refusées disent le message du catalogue', async () => {
    servir({ '/lms/seances/history': SEANCES, '/attendances': SANS_ETABLISSEMENT })
    const h = await monter(useSeanceAttendanceHistory)
    await h.viewAttendances({ id: 3 })
    expect(h.attendancesError.value).toBe(ERROR_MESSAGES.noInstitution)
    expect(h.attendancesError.value).not.toMatch(BRUT)
  })

  it('l\'ouverture directe d\'une séance hors liste dit le message du catalogue', async () => {
    servir({ '/lms/seances/history': SEANCES, '/attendances': SANS_ACCES_KLASSCI })
    const h = await monter(useSeanceAttendanceHistory)
    await h.openSeanceById(99)
    expect(h.attendancesError.value).toBe(ERROR_MESSAGES.klassciTokenMissing)
    expect(h.attendancesError.value).not.toMatch(BRUT)
  })

  it('une suppression en panne dit le message du catalogue', async () => {
    servir({ '/lms/seances/history': SEANCES, '/seances/3': PANNE })
    const h = await monter(useSeanceAttendanceHistory)
    await h.deleteSeance({ id: 3, klassci_seance_id: 'S3' })
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(toastError.mock.calls[0][0]).toBe(ERROR_MESSAGES.server)
  })
})
