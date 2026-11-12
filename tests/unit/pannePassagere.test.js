/**
 * Une erreur est-elle une PANNE PASSAGÈRE (un nouvel essai peut réussir) ou un refus définitif ?
 *
 * Liste d'AUTORISATION (revue de #508) : 5xx, 429, et l'absence de réponse (réseau coupé, délai
 * dépassé). Tout autre statut est un refus que réessayer ne changera pas.
 */
import { describe, it, expect } from 'vitest'
import { estPannePassagere } from '@/utils/pannePassagere'
import { userError } from '@/utils/userError'

describe('estPannePassagere', () => {
  it('5xx, 429 et sans réponse : passagère', () => {
    for (const status of [500, 502, 503, 504, 429]) expect(estPannePassagere({ response: { status } })).toBe(true)
    expect(estPannePassagere(new Error('Network Error'))).toBe(true)
    expect(estPannePassagere({ code: 'ECONNABORTED' })).toBe(true)
  })

  it('tout autre statut : définitive', () => {
    for (const status of [400, 401, 403, 404, 409, 410, 422]) expect(estPannePassagere({ response: { status } })).toBe(false)
  })

  it('rien à juger : passagère (on laisse l’utilisateur réessayer)', () => {
    expect(estPannePassagere(null)).toBe(true)
  })
})

// Lot « Réessayer », PR A : une réponse 2xx « success: false » est levée par userError, SANS
// `response` ; « sans réponse » vaut panne réseau. L'option explicite `definitif` la classe refus.

describe('estPannePassagere — erreur marquée définitive', () => {
  it('definitif : jamais passagère, même sans réponse', () => {
    expect(estPannePassagere(userError('Refus', { definitif: true }))).toBe(false)
    expect(estPannePassagere({ definitif: true })).toBe(false)
  })

  it('sans réponse et sans definitif : passagère (inchangé pour les 20 autres appels de userError)', () => {
    expect(estPannePassagere(userError('Le script de visio ne s’est pas chargé'))).toBe(true)
  })

  it('userError garde son contrat : le texte du front dans userMessage, definitif seulement si demandé', () => {
    const e = userError('Texte du front')
    expect(e.userMessage).toBe('Texte du front')
    expect(e.definitif).toBeUndefined()
    expect(userError('Refus', { definitif: true }).definitif).toBe(true)
  })
})
