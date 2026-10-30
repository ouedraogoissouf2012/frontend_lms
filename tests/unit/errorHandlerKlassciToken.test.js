/**
 * #420 — un compte sans accès KLASSCI n'est pas une session expirée.
 *
 * Contrat serveur : un 401 d'une route adossée à KLASSCI a trois sens, que seul
 * `reason` distingue — absent (session LMS morte), `klassci_token_missing` (ce
 * compte n'a aucun accès KLASSCI : se reconnecter n'y change rien) et
 * `klassci_session_expired` (KLASSCI refuse le jeton). La décision se lit sur
 * `reason`, jamais sur le texte du message.
 */
import { describe, it, expect } from 'vitest'
import { shouldForceLogout, normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const refus = ({ url = '/api/evaluations', message = 'Accès refusé.', reason } = {}) => ({
  response: { status: 401, data: { success: false, message, ...(reason ? { reason } : {}) } },
  config: { url },
})

describe('#420 — klassci_token_missing', () => {
  it('devient une catégorie du catalogue, au message vrai et sans consigne de reconnexion', () => {
    const n = normalizeError(refus({ reason: 'klassci_token_missing' }))
    expect(n.category).toBe('klassciTokenMissing')
    expect(n.userMessage).toBe(ERROR_MESSAGES.klassciTokenMissing)
    expect(n.userMessage).toMatch(/KLASSCI/)
    expect(n.userMessage).not.toMatch(/reconnect/i)
  })

  it('ne lit jamais le texte du serveur', () => {
    const n = normalizeError(refus({ reason: 'klassci_token_missing', message: 'texte serveur' }))
    expect(n.userMessage).not.toContain('texte serveur')
  })

  it('ne déconnecte pas, hors /proxy/ et même si le message ne nomme pas KLASSCI', () => {
    expect(shouldForceLogout(refus({ reason: 'klassci_token_missing' }))).toBe(false)
  })

  it('klassci_session_expired ne déconnecte pas non plus, sur le même message neutre', () => {
    expect(shouldForceLogout(refus({ reason: 'klassci_session_expired' }))).toBe(false)
  })

  it('un 401 SANS reason reste une session LMS morte : déconnexion', () => {
    expect(shouldForceLogout(refus({ message: 'Unauthenticated.' }))).toBe(true)
  })

  it('un reason inconnu ne protège pas la session', () => {
    expect(shouldForceLogout(refus({ reason: 'motif_inconnu' }))).toBe(true)
  })
})
