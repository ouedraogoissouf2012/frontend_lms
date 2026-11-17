/**
 * lms_backend#922 (PR #1139, ADR-906-01) : quand un même statut porte plusieurs sens, chacun dit son `reason`.
 * Le catalogue traduit chaque motif qu'un ÉCRAN peut recevoir, avec son texte exact et sa nature (transitoire :
 * un nouvel essai a un sens, le délai de Retry-After s'y ajoute ; sinon définitif). Les motifs `webhook_*` ne
 * s'adressent qu'au serveur d'enregistrement : aucun écran ne les reçoit, ils restent hors du catalogue.
 * Un motif INCONNU ne montre jamais le texte du serveur (D0) : le statut décide.
 * Le lecteur de quiz montrait un texte fixe pour tout échec : il dit désormais le motif.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ start: vi.fn(), submit: vi.fn(), toastError: vi.fn() }))
vi.mock('@/services/knowledgeCheck', () => ({ default: { startAttempt: (...a) => h.start(...a), submitAttempt: (...a) => h.submit(...a) } }))
vi.mock('@/composables/useToast', () => ({ toast: { error: h.toastError, success: vi.fn(), info: vi.fn(), warning: vi.fn() } }))

import { normalizeError, messageForReason } from '@/services/errorHandler'
import { entreeDuMotif } from '@/services/refusalReasons'
import { useKnowledgeCheckPlayer } from '@/composables/useKnowledgeCheckPlayer'

const refus = (status, reason, extra = {}) => ({
  response: { status, data: { success: false, message: 'Texte du serveur, jamais montré', reason }, headers: {}, ...extra },
})

// [motif, statut reçu, texte exact, transitoire]
const MOTIFS = [
  ['ip_quota_exceeded', 429, 'Trop de demandes envoyées depuis cette connexion. Réessayez dans un instant.', true],
  ['school_requests_global_cap', 429, "Le nombre maximal de demandes d'inscription d'école est atteint pour aujourd'hui. Réessayez demain.", false],
  ['training_session_transition_not_allowed', 409, "Cette action n'est pas possible dans l'état actuel de la période.", false],
  ['evaluation_attempt_not_started', 409, "Aucune tentative n'est en cours pour cette évaluation : démarrez-la avant de la rendre.", false],
  ['evaluation_submission_not_gradable', 409, "Cette copie ne peut pas encore être notée : elle n'a pas été rendue.", false],
  ['quiz_unavailable', 403, "Ce quiz n'est pas disponible actuellement.", false],
  ['quiz_max_attempts', 403, 'Vous avez utilisé toutes vos tentatives pour ce quiz.', false],
  ['quiz_attempt_conflict', 409, "Une autre tentative vient d'être enregistrée pour ce quiz. Rechargez la page.", false],
  ['quiz_attempt_already_submitted', 422, 'Cette tentative a déjà été rendue.', false],
  ['quiz_time_expired', 422, 'Le temps est écoulé : votre tentative a été rendue automatiquement.', false],
]

describe('lms_backend#922 — chaque motif reçu par un écran a son texte', () => {
  it.each(MOTIFS)('%s (%i) : le texte exact du catalogue, et sa nature', (reason, status, texte, transitoire) => {
    expect(messageForReason(reason)).toBe(texte)
    expect(entreeDuMotif(reason)?.transitoire).toBe(transitoire)
    const n = normalizeError(refus(status, reason))
    expect(n.userMessage).toBe(texte)
    expect(n.userMessage).not.toContain('serveur')
  })

  it('les deux bornes du 429 se distinguent : la minute par adresse, le plafond du jour', () => {
    expect(normalizeError(refus(429, 'ip_quota_exceeded')).category)
      .not.toBe(normalizeError(refus(429, 'school_requests_global_cap')).category)
  })

  it('la borne par adresse est transitoire : le délai de Retry-After remplace « dans un instant »', () => {
    const avecDelai = normalizeError(refus(429, 'ip_quota_exceeded', { headers: { 'retry-after': '30' } })).userMessage
    expect(avecDelai.startsWith('Trop de demandes envoyées depuis cette connexion. Réessayez ')).toBe(true)
    expect(avecDelai).not.toContain('dans un instant')
  })

  it('les motifs webhook_* (serveur à serveur) restent hors du catalogue', () => {
    for (const r of ['webhook_signature_missing', 'webhook_timestamp_invalid', 'webhook_timestamp_expired', 'webhook_signature_invalid', 'webhook_already_processed']) {
      expect(entreeDuMotif(r)).toBeNull()
    }
  })

  it.each([403, 409, 422, 429])('un motif inconnu (%i) : le message du statut, jamais le texte du serveur (D0)', (status) => {
    const inconnu = normalizeError(refus(status, 'motif_pas_encore_traduit'))
    expect(inconnu).toEqual(normalizeError(refus(status, undefined)))
    expect(inconnu.userMessage).not.toContain('serveur')
  })
})

describe('lms_backend#922 — le lecteur de quiz dit le motif', () => {
  const quiz = { id: 7, title: 'Quiz', passing_score: 70 }
  function monter() {
    let api
    mount(defineComponent({ setup() { api = useKnowledgeCheckPlayer({ quiz }, vi.fn()); return () => null } }))
    return api
  }
  beforeEach(() => { Object.values(h).forEach((f) => f.mockReset()) })

  it('au démarrage refusé (quiz_max_attempts) : le texte du motif, pas « Erreur lors du demarrage »', async () => {
    h.start.mockRejectedValue(refus(403, 'quiz_max_attempts'))
    const api = monter()
    await api.startQuiz()
    await flushPromises()
    expect(h.toastError).toHaveBeenCalledWith('Vous avez utilisé toutes vos tentatives pour ce quiz.')
    expect(api.state.value).toBe('intro')
  })

  it('à la remise refusée (quiz_time_expired) : le texte du motif', async () => {
    h.start.mockResolvedValue({ success: true, data: { time_limit_minutes: null, questions: [{ question: 'Q', type: 'single', options: ['a'] }] } })
    h.submit.mockRejectedValue(refus(422, 'quiz_time_expired'))
    const api = monter()
    await api.startQuiz()
    await flushPromises()
    await api.submitQuiz()
    await flushPromises()
    expect(h.toastError).toHaveBeenCalledWith('Le temps est écoulé : votre tentative a été rendue automatiquement.')
  })
})
