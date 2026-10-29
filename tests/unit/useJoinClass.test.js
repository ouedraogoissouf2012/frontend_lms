/**
 * « Rejoindre une classe » côté élève (#391) : POST /me/inscriptions { code }. Le
 * serveur est juge du format ; l'écran normalise seulement la saisie (majuscules, sans
 * espaces). Chaque refus a son message : motifs par le catalogue (ADR-906-01), et un
 * message propre pour le code inconnu (404).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const rejoindre = vi.fn()
vi.mock('@/services/enrolmentCodes', () => ({ enrolmentCodesService: { rejoindre: (...a) => rejoindre(...a) } }))

import { useJoinClass, normaliserCode } from '@/composables/useJoinClass'

function erreurHttp(status, reason) {
  const err = Object.assign(new Error(`HTTP ${status}`), { response: { status, data: { success: false, message: 'serveur', ...(reason ? { reason } : {}) } } })
  err.userMessage = normalizeError(err).userMessage
  return err
}

// Bloc, pas expression : une fonction RETOURNÉE par beforeEach est un nettoyage que
// Vitest appelle après le test — `mockReset()` rend le mock, qui serait alors invoqué.
beforeEach(() => {
  rejoindre.mockReset()
})

describe('normaliserCode (#391)', () => {
  it.each([
    [' ab23 cd ', 'AB23CD'],
    ['q7rt4k', 'Q7RT4K'],
    ['', ''],
    [null, ''],
  ])('%o → %o', (saisie, attendu) => expect(normaliserCode(saisie)).toBe(attendu))
})

describe('useJoinClass (#391)', () => {
  it('envoie le code normalisé et garde la classe et le message du serveur', async () => {
    rejoindre.mockResolvedValue({ success: true, message: 'Vous avez rejoint la classe.', data: { classe: { id: 9, libelle: 'Session Data' } } })
    const j = useJoinClass()
    j.code.value = ' q7rt 4k '
    expect(await j.rejoindre()).toBe(true)
    expect(rejoindre).toHaveBeenCalledWith('Q7RT4K')
    expect(j.result.value).toEqual({ classe: { id: 9, libelle: 'Session Data' }, message: 'Vous avez rejoint la classe.' })
    expect(j.error.value).toBe('')
  })

  it('« déjà inscrit » (200) est un succès, pas une erreur', async () => {
    rejoindre.mockResolvedValue({ success: true, message: 'Vous êtes déjà inscrit dans cette classe.', data: { classe: { id: 9, libelle: 'Session Data' } } })
    const j = useJoinClass()
    j.code.value = 'Q7RT4K'
    expect(await j.rejoindre()).toBe(true)
    expect(j.result.value.message).toBe('Vous êtes déjà inscrit dans cette classe.')
  })

  it('saisie vide : aucun appel', async () => {
    const j = useJoinClass()
    j.code.value = '   '
    expect(await j.rejoindre()).toBe(false)
    expect(rejoindre).not.toHaveBeenCalled()
  })

  it('404 : « Ce code ne correspond à aucune classe »', async () => {
    rejoindre.mockRejectedValue(erreurHttp(404))
    const j = useJoinClass()
    j.code.value = 'ZZZZZZ'
    await j.rejoindre()
    expect(j.error.value).toBe(ERROR_MESSAGES.codeInconnu)
    expect(j.result.value).toBe(null)
  })

  it.each([
    [409, 'enrolment_not_active', 'enrolmentNotActive'],
    [429, 'account_quota_exceeded', 'accountQuotaExceeded'],
    [429, 'institution_cap_reached', 'institutionCapReached'],
  ])('%i %s → message du catalogue', async (status, reason, cle) => {
    rejoindre.mockRejectedValue(erreurHttp(status, reason))
    const j = useJoinClass()
    j.code.value = 'Q7RT4K'
    await j.rejoindre()
    expect(j.error.value).toBe(ERROR_MESSAGES[cle])
  })

  it('un nouvel essai efface le résultat et l’erreur précédents', async () => {
    rejoindre.mockRejectedValueOnce(erreurHttp(404)).mockResolvedValueOnce({ success: true, message: 'Vous avez rejoint la classe.', data: { classe: { id: 9, libelle: 'S' } } })
    const j = useJoinClass()
    j.code.value = 'ZZZZZZ'
    await j.rejoindre()
    j.code.value = 'Q7RT4K'
    await j.rejoindre()
    expect(j.error.value).toBe('')
    expect(j.result.value.message).toBe('Vous avez rejoint la classe.')
  })
})
