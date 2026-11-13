/**
 * C28 (contrat back #1037) : l'échéance d'une tentative est `ends_at`, écrite au démarrage et figée.
 * La remise est acceptée jusqu'à `ends_at` + 60 s ; après, 409 `evaluation_attempt_locked` et la copie
 * passe `verrouille` (réponses gardées, jamais notée). Décisions de la superviseure :
 * - D-28a : la page relit sa copie par GET /my-submission (`ends_at`, `status`), id vérifié ;
 * - D-28b : temps restant = `ends_at` - maintenant, l'horloge du poste corrigée UNE fois du décalage
 *   avec `server_time` (GET /time-status) ;
 * - D-28c : `ends_at` nul (entraînement, copie d'avant C28) → comportement actuel (durée) ;
 * - D-28d/e : verrou (refus à la remise, ou copie lue `verrouille`) → état verrouillé, message du
 *   catalogue (D0), minuteurs arrêtés, plus aucune remise.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const h = vi.hoisted(() => ({
  getEvaluation: vi.fn(), submitEvaluation: vi.fn(), getTimeStatus: vi.fn(), getMySubmission: vi.fn(),
  push: vi.fn(), toast: { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() },
  query: { submission_id: '7' },
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '42' }, query: h.query }),
  useRouter: () => ({ push: h.push }),
}))
vi.mock('@/services/evaluation', () => ({
  default: {
    getEvaluation: h.getEvaluation, submitEvaluation: h.submitEvaluation,
    getTimeStatus: h.getTimeStatus, getMySubmission: h.getMySubmission,
  },
}))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ id: 1 }) } }))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: () => Promise.resolve(true) }) }))

import { useTakeEvaluation } from '@/composables/useTakeEvaluation'

const T0 = Date.parse('2026-11-14T08:00:00Z')
const iso = (ms) => new Date(ms).toISOString()
const PIEGE = 'SQLSTATE piège serveur'
const EVAL = { id: 42, titre: 'T', duree_minutes: 30, questions: [{ id: 'q1', type: 'qcm', points: 1, options: ['A', 'B'] }] }
const copie = (extra = {}) => ({ success: true, data: { id: 7, status: 'en_cours', ends_at: iso(T0 + 90_000), ...extra } })
const verrou = () => ({ response: { status: 409, data: { success: false, message: PIEGE, reason: 'evaluation_attempt_locked' } } })

async function monter() {
  let api
  mount(defineComponent({ setup() { api = useTakeEvaluation(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(T0)
  h.query = { submission_id: '7' }
  h.getEvaluation.mockImplementation(() => Promise.resolve({ success: true, data: structuredClone(EVAL) }))
  h.getMySubmission.mockResolvedValue(copie())
  h.getTimeStatus.mockResolvedValue({ success: true, data: { server_time: iso(T0) } })
  h.submitEvaluation.mockResolvedValue({ success: true, data: { note_sur_20: 18 } })
})
afterEach(() => { vi.useRealTimers() })

describe('useTakeEvaluation — l’échéance de la copie (C28)', () => {
  it('1. ends_at dans 90 s → 90 s ; rechargée 30 s plus tard → 60 s, pas la durée entière', async () => {
    expect((await monter()).timeRemaining.value).toBe(90)
    vi.setSystemTime(T0 + 30_000)
    expect((await monter()).timeRemaining.value).toBe(60)
    expect(h.getMySubmission).toHaveBeenCalledWith('42')
  })

  it('1 bis. D-28b : l’horloge du poste est corrigée du décalage avec server_time', async () => {
    h.getTimeStatus.mockResolvedValue({ success: true, data: { server_time: iso(T0 + 10_000) } })
    expect((await monter()).timeRemaining.value).toBe(80)
  })

  it('2. à zéro → remise automatique, une seule', async () => {
    await monter()
    await vi.advanceTimersByTimeAsync(95_000)
    expect(h.submitEvaluation).toHaveBeenCalledTimes(1)
  })

  it('3. ends_at nul → comportement actuel (durée de l’évaluation)', async () => {
    h.getMySubmission.mockResolvedValue(copie({ ends_at: null }))
    expect((await monter()).timeRemaining.value).toBe(1800)
  })

  it('4. 409 evaluation_attempt_locked à la remise → état verrouillé, message du catalogue, minuteurs arrêtés', async () => {
    h.submitEvaluation.mockRejectedValue(verrou())
    const c = await monter()
    await c.submitEvaluation()
    expect(c.copieVerrouillee.value).toBe(true)
    expect(c.messageVerrou.value).toBe(ERROR_MESSAGES.evaluationAttemptLocked)
    expect(c.messageVerrou.value).not.toContain('SQLSTATE')
    expect(c.showResultsModal.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    expect(h.toast.error).not.toHaveBeenCalledWith(expect.stringContaining('SQLSTATE'))
  })

  it('5. après le verrou, une nouvelle remise n’appelle plus le serveur', async () => {
    h.submitEvaluation.mockRejectedValue(verrou())
    const c = await monter()
    await c.submitEvaluation()
    await c.submitEvaluation()
    expect(h.submitEvaluation).toHaveBeenCalledTimes(1)
  })

  it('6. copie lue verrouille au chargement → état verrouillé, aucune remise, aucun minuteur', async () => {
    h.getMySubmission.mockResolvedValue(copie({ status: 'verrouille' }))
    const c = await monter()
    expect(c.copieVerrouillee.value).toBe(true)
    expect(c.messageVerrou.value).toBe(ERROR_MESSAGES.evaluationAttemptLocked)
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(200_000)
    expect(h.submitEvaluation).not.toHaveBeenCalled()
  })

  it('7. my-submission rend une autre copie → erreur honnête, rien à passer, aucun minuteur', async () => {
    h.getMySubmission.mockResolvedValue(copie({ id: 8 }))
    const c = await monter()
    expect(c.error.value).toEqual(expect.any(String))
    expect(c.evaluation.value).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  // Ajout déclaré : l'entraînement n'a pas d'échéance (`ends_at` nul, contrat #1037), et /my-submission
  // rend la tentative de plus haut numéro sans distinguer l'entraînement : la vérification d'id pourrait
  // y bloquer à tort un élève. L'entraînement ne relit donc pas sa copie (D-28c : la durée).
  it('7 bis. entraînement : la copie n’est pas relue, le minuteur garde la durée', async () => {
    h.query = { submission_id: '9', practice: '1' }
    const c = await monter()
    expect(h.getMySubmission).not.toHaveBeenCalled()
    expect(c.error.value).toBeNull()
    expect(c.timeRemaining.value).toBe(1800)
  })

  it('8. 409 sans reason (aucune tentative en cours) → comportement actuel, pas d’état verrouillé', async () => {
    h.submitEvaluation.mockRejectedValue({ response: { status: 409, data: { success: false, message: PIEGE } } })
    const c = await monter()
    await c.submitEvaluation()
    expect(c.copieVerrouillee.value).toBe(false)
    expect(h.toast.error).toHaveBeenCalledWith('Erreur lors de la soumission de l\'évaluation')
  })
})
