/**
 * Refus de démarrage d'une évaluation (lms_backend #1011, ARRÊT 1 validé) : chaque `reason` devient
 * un message du catalogue, jamais le texte du serveur (D0).
 *
 * `POST /evaluations/{id}/start` (EvaluationStudentAttemptController) refuse en 403 avec un motif
 * stable. Le libellé de `evaluation_offline_only` ne suppose pas le mode : le serveur dit seulement
 * « is_online=false, pas de passage LMS » (EvaluationAttemptStateService).
 */
import { describe, it, expect } from 'vitest'
import { normalizeError, messageForReason } from '@/services/errorHandler'

const PIEGE = 'Texte du serveur, jamais affiché'
const refus = (reason) => ({ response: { status: 403, data: { success: false, message: PIEGE, reason } } })

const ATTENDU = {
  evaluation_window_closed: 'Cette évaluation n’est pas ouverte en ce moment.',
  evaluation_max_attempts: 'Vous avez utilisé toutes vos tentatives pour cette évaluation.',
  evaluation_retake_forbidden: 'Cette évaluation ne peut pas être reprise.',
  evaluation_offline_only: 'Cette évaluation ne se passe pas en ligne.',
}

describe('motifs de refus de démarrage d’une évaluation (#1011)', () => {
  for (const [reason, message] of Object.entries(ATTENDU)) {
    it(`${reason} → son message, jamais le texte du serveur`, () => {
      const n = normalizeError(refus(reason))
      expect(n.userMessage).toBe(message)
      expect(n.userMessage).not.toContain(PIEGE)
      expect(messageForReason(reason)).toBe(message)
    })
  }

  it('la fenêtre fermée garde son message même avec la clé racine `window` hors enveloppe', () => {
    const e = refus('evaluation_window_closed')
    e.response.data.window = { opens_at: '2026-11-12T08:00:00Z' }
    expect(normalizeError(e).userMessage).toBe(ATTENDU.evaluation_window_closed)
  })
})
