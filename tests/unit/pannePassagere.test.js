/**
 * Une erreur est-elle une PANNE PASSAGÈRE (un nouvel essai peut réussir) ou un refus définitif ?
 *
 * Liste d'AUTORISATION (revue de #508) : 5xx, 429, et l'absence de réponse (réseau coupé, délai
 * dépassé). Tout autre statut est un refus que réessayer ne changera pas.
 */
import { describe, it, expect } from 'vitest'
import { estPannePassagere } from '@/utils/pannePassagere'

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
