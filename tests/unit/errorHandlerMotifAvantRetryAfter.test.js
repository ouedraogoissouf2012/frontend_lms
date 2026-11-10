/**
 * Un motif CONNU du catalogue prime sur la règle générique « 503 + Retry-After » (décision de la
 * superviseure). Avant : `normalizeError` lisait l'en-tête AVANT le `reason`, et le motif
 * `evaluation_window_unverifiable` (lms_backend #1019, 503 avec Retry-After) aurait été dit
 * « Service KLASSCI temporairement indisponible ». Le délai de l'en-tête est dit pour les deux
 * catégories transitoires ; un refus définitif ne prend pas de délai.
 */
import { describe, it, expect } from 'vitest'
import { normalizeError } from '@/services/errorHandler'

const reponse = (status, data, headers = {}) => ({ response: { status, data, headers }, config: { url: '/api/x' } })
const PIEGE = 'Texte du serveur, jamais affiché'

describe('normalizeError : un motif connu avant Retry-After', () => {
  it('fenêtre invérifiable (503 + Retry-After 30) : son message, avec le délai', () => {
    const n = normalizeError(reponse(503, { message: PIEGE, reason: 'evaluation_window_unverifiable' }, { 'retry-after': '30' }))
    expect(n.category).toBe('evaluationWindowUnverifiable')
    expect(n.userMessage).toBe('La disponibilité de cette évaluation ne peut pas être vérifiée pour le moment. Réessayez dans 30 secondes.')
  })

  it('fenêtre invérifiable sans délai lisible : « dans un instant »', () => {
    const n = normalizeError(reponse(503, { reason: 'evaluation_window_unverifiable' }, { 'retry-after': 'Wed, 21 Oct 2015 07:28:00 GMT' }))
    expect(n.userMessage).toBe('La disponibilité de cette évaluation ne peut pas être vérifiée pour le moment. Réessayez dans un instant.')
  })

  it('un refus définitif ne prend pas de délai, même avec un en-tête', () => {
    const n = normalizeError(reponse(403, { reason: 'evaluation_max_attempts' }, { 'retry-after': '30' }))
    expect(n.userMessage).toBe('Vous avez utilisé toutes vos tentatives pour cette évaluation.')
  })

  it('motif inconnu + 503 + Retry-After : le repli KLASSCI, avec le délai arrondi à la minute', () => {
    const n = normalizeError(reponse(503, { reason: 'motif_inconnu' }, { 'retry-after': '61' }))
    expect(n.category).toBe('klassciUnavailable')
    expect(n.userMessage).toBe('Service KLASSCI temporairement indisponible. Réessayez dans 2 minutes.')
  })

  it('503 sans Retry-After ni motif : « server », inchangé', () => {
    expect(normalizeError(reponse(503, {})).category).toBe('server')
  })
})
