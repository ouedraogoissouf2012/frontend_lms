/**
 * Motifs de refus (#391, ADR-906-01) : quand un même statut porte plusieurs sens, la
 * réponse porte `reason`. Un motif CONNU est traduit par le catalogue ; un motif
 * inconnu retombe sur le message du statut. Le message serveur n'est jamais repris.
 */
import { describe, it, expect } from 'vitest'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const refus = (status, reason) => ({ response: { status, data: { success: false, message: 'texte serveur', reason } } })

describe('errorHandler — motifs de refus (ADR-906-01)', () => {
  it.each([
    [409, 'enrolment_not_active', 'enrolmentNotActive'],
    [409, 'no_institution', 'noInstitution'],
    [429, 'account_quota_exceeded', 'accountQuotaExceeded'],
    [429, 'account_daily_cap_reached', 'accountDailyCapReached'],
    [429, 'institution_cap_reached', 'institutionCapReached'],
  ])('%i %s → catégorie %s et son message du catalogue', (status, reason, categorie) => {
    const r = normalizeError(refus(status, reason))
    expect(r.category).toBe(categorie)
    expect(r.userMessage).toBe(ERROR_MESSAGES[categorie])
    expect(r.userMessage).not.toContain('texte serveur')
  })

  it('chaque motif a un message distinct et non vide', () => {
    const cles = ['enrolmentNotActive', 'noInstitution', 'accountQuotaExceeded', 'accountDailyCapReached', 'institutionCapReached']
    const textes = cles.map((c) => ERROR_MESSAGES[c])
    textes.forEach((t) => expect(typeof t === 'string' && t.length > 10).toBe(true))
    expect(new Set(textes).size).toBe(cles.length)
  })

  it('motif INCONNU : retombe sur le message du statut (fail-secure)', () => {
    expect(normalizeError(refus(409, 'motif_jamais_vu')).userMessage).toBe(ERROR_MESSAGES.conflict)
    expect(normalizeError(refus(429, 'motif_jamais_vu')).userMessage).toBe(ERROR_MESSAGES.rateLimit)
  })

  it('un motif dont le nom vient d’Object.prototype n’est pas un motif', () => {
    expect(normalizeError(refus(409, 'toString')).userMessage).toBe(ERROR_MESSAGES.conflict)
  })

  it('non-régression : klassci_session_expired garde son traitement', () => {
    expect(normalizeError(refus(401, 'klassci_session_expired')).category).toBe('klassciExpired')
  })
})
