/**
 * Test du composable useStudentEvaluationsList (H2) : chargement, segmentation
 * (à faire / terminées / s'entraîner) et navigation. api/evaluation/router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

const getUser = vi.fn(() => ({ klassci_id: 7 }))
const apiGet = vi.fn()
vi.mock('@/services/api', () => ({
  default: { get: (...a) => apiGet(...a) },
  auth: { getUser: () => getUser() },
}))

const toastError = vi.fn()
vi.mock('@/composables/useToast', () => ({ toast: { error: (...a) => toastError(...a) } }))

const startEvaluation = vi.fn()
vi.mock('@/services/evaluation', () => ({
  default: { startEvaluation: (...a) => startEvaluation(...a) },
}))

import { useStudentEvaluationsList } from '@/composables/useStudentEvaluationsList'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

// Fenêtre ouverte = à faire ; soumission soumise = terminée ; fenêtre fermée sans
// soumission = s'entraîner.
const EVALS = [
  { id: 1, titre: 'Ouverte', programmation: { window: { has_started: true, is_open: true } } },
  { id: 2, titre: 'Soumise', student_submission: { id: 20, status: 'soumis', note_sur_20: 15 } },
  { id: 3, titre: 'Passée', programmation: { window: { has_started: true, is_open: false } } },
]

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useStudentEvaluationsList(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => {
  push.mockClear(); apiGet.mockReset(); startEvaluation.mockReset(); toastError.mockReset()
  getUser.mockReturnValue({ klassci_id: 7 })
  apiGet.mockResolvedValue({ success: true, data: EVALS })
})

describe('useStudentEvaluationsList (H2)', () => {
  it('charge via /evaluations/student et segmente en 3 listes', async () => {
    const u = await setup()
    expect(apiGet).toHaveBeenCalledWith('/evaluations/student')
    expect(u.evaluationsAFaire.value.map(e => e.id)).toEqual([1])
    expect(u.evaluationsTerminees.value.map(e => e.id)).toEqual([2])
    expect(u.evaluationsEntrainement.value.map(e => e.id)).toEqual([3])
  })

  it('redirige vers /login sans utilisateur', async () => {
    getUser.mockReturnValue(null)
    await setup()
    expect(push).toHaveBeenCalledWith('/login')
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('startEvaluation démarre puis navigue (avec practice si applicable)', async () => {
    startEvaluation.mockResolvedValue({ success: true, is_practice: true, data: { id: 99 } })
    const u = await setup()
    await u.startEvaluation({ id: 3 })
    expect(startEvaluation).toHaveBeenCalledWith(3, 7)
    expect(push).toHaveBeenCalledWith({
      name: 'TakeEvaluation', params: { id: 3 }, query: { submission_id: 99, practice: '1' },
    })
  })

  it('viewResults navigue vers EvaluationResults', async () => {
    const u = await setup()
    u.viewResults({ id: 5 })
    expect(push).toHaveBeenCalledWith({ name: 'EvaluationResults', params: { id: 5 } })
  })

  // Refus de démarrage (#1011, ARRÊT 1) : le motif, jamais le texte du serveur (D0). Le site était
  // gelé dans le cliquet visioMessagesSansTexteBrut « en attente des reason de #1011 ».
  describe('refus de démarrage : le motif traduit, jamais le texte du serveur', () => {
    const PIEGE = 'Texte du serveur, jamais affiché'
    const refus = (status, reason) => ({ response: { status, data: { success: false, message: PIEGE, reason } } })
    const cas = [
      ['fenêtre fermée', refus(403, 'evaluation_window_closed'), 'Cette évaluation n’est pas ouverte en ce moment.'],
      ['tentatives épuisées', refus(403, 'evaluation_max_attempts'), 'Vous avez utilisé toutes vos tentatives pour cette évaluation.'],
      ['reprise interdite', refus(403, 'evaluation_retake_forbidden'), 'Cette évaluation ne peut pas être reprise.'],
      ['hors ligne', refus(403, 'evaluation_offline_only'), 'Cette évaluation ne se passe pas en ligne.'],
      ['fenêtre invérifiable (503)', refus(503), ERROR_MESSAGES.server],
      // Revue de #516 : le parcours réel de l'élève, avec le motif de #1019 et son délai.
      ['fenêtre invérifiable, motif #1019 (503 + Retry-After 30)', { response: { status: 503, headers: { 'retry-after': '30' }, data: { success: false, message: PIEGE, reason: 'evaluation_window_unverifiable' } } },
        'La disponibilité de cette évaluation ne peut pas être vérifiée pour le moment. Réessayez dans 30 secondes.'],
      ['évaluation non disponible (404)', refus(404), ERROR_MESSAGES.notFound],
    ]
    for (const [nom, erreur, message] of cas) {
      it(`${nom} : « ${message} »`, async () => {
        startEvaluation.mockRejectedValue(erreur)
        const u = await setup()
        await u.startEvaluation({ id: 1 })
        expect(toastError).toHaveBeenCalledWith(message)
        expect(push).not.toHaveBeenCalled()
      })
    }

    it('le motif posé par l’intercepteur (userMessage) prime', async () => {
      startEvaluation.mockRejectedValue({ ...refus(403, 'evaluation_max_attempts'), userMessage: 'Motif de l’intercepteur.' })
      const u = await setup()
      await u.startEvaluation({ id: 1 })
      expect(toastError).toHaveBeenCalledWith('Motif de l’intercepteur.')
    })

    it('une réponse « success: false » : son reason traduit, sinon le texte du front, jamais son message', async () => {
      startEvaluation.mockResolvedValue({ success: false, message: PIEGE, reason: 'evaluation_offline_only' })
      const u = await setup()
      await u.startEvaluation({ id: 1 })
      expect(toastError).toHaveBeenLastCalledWith('Cette évaluation ne se passe pas en ligne.')
      startEvaluation.mockResolvedValue({ success: false, message: PIEGE })
      await u.startEvaluation({ id: 1 })
      expect(toastError).toHaveBeenLastCalledWith('Impossible de démarrer l’évaluation.')
      expect(toastError.mock.calls.flat()).not.toContain(PIEGE)
    })
  })

  // Test inversé (A-E23) : il exigeait « Session expirée » écrit en dur pour TOUT 401.
  // Un vrai 401 sans motif reste une session expirée, dite par le catalogue ; le 401
  // `klassci_token_missing` est couvert par messagesBruts.test.js (vrai client).
  it('un 401 sans motif dit le message de session du catalogue', async () => {
    apiGet.mockRejectedValue({ response: { status: 401 } })
    const u = await setup()
    expect(u.error.value).toBe(ERROR_MESSAGES.auth)
    expect(u.loading.value).toBe(false)
  })
})

// Lot « retour honnête » (instruction des rouges du 10/11) : erreurs telles que l'intercepteur les rend.
// Le 401 `klassci_token_missing` est un refus DÉFINITIF (lot 3d, école autonome) ; le 500 une panne.
const PIEGE_SERVEUR = 'Texte serveur, jamais affiché'
const refusDefinitif = () => Object.assign(new Error('HTTP 401'), {
  response: { status: 401, data: { success: false, message: PIEGE_SERVEUR, reason: 'klassci_token_missing' } },
  userMessage: "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées.",
})
const pannePassagere = () => Object.assign(new Error('HTTP 500'), {
  response: { status: 500, data: { message: PIEGE_SERVEUR } },
  userMessage: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
})
const MOTIF_JETON = "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées."

describe('useStudentEvaluationsList — Réessayer seulement sur une panne passagère', () => {
  it('refus définitif (401 jeton KLASSCI) : le motif ; pas de Réessayer', async () => {
    apiGet.mockRejectedValue(refusDefinitif())
    const u = await setup()
    expect(u.error.value).toBe(MOTIF_JETON)
    expect(u.canRetry.value).toBe(false)
  })

  it('panne passagère (500) : Réessayer reste offert', async () => {
    apiGet.mockRejectedValue(pannePassagere())
    const u = await setup()
    expect(u.canRetry.value).toBe(true)
  })
})

describe('useStudentEvaluationsList — canRetry suit le dernier chargement', () => {
  it('refus, puis rechargement réussi : Réessayer revient', async () => {
    apiGet.mockRejectedValue(refusDefinitif())
    const u = await setup()
    expect(u.canRetry.value).toBe(false)
    apiGet.mockResolvedValue({ success: true, data: EVALS })
    await u.loadEvaluations()
    expect(u.canRetry.value).toBe(true)
  })
})
