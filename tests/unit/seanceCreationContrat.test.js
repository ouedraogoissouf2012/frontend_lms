/**
 * Création d'une séance locale (ARRÊT 1 validé) — le contrat côté front :
 * - POST /lms/seances ; une réponse sans « success: true » n'a rien créé de connu (pas de faux succès) ;
 * - `date_seance` = le DÉBUT, en ISO 8601 AVEC décalage (D4, fixé par S-matière côté back) ;
 * - les trois refus motivés de S-matière (`class_out_of_scope`, `subject_out_of_scope`,
 *   `subject_not_in_class_program`, Fille 1 e71cf2e8) ont
 *   leur message du catalogue, jamais le texte du serveur (D0), et sont définitifs (pas de Réessayer).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }))
vi.mock('@/services/api', () => ({ default: api }))

import { lmsSeancesService } from '@/services/lmsSeances'
import { endpoints } from '@/services/endpoints'
import { normalizeError, messageForReason, invalidResponseError } from '@/services/errorHandler'
import { estPannePassagere } from '@/utils/pannePassagere'
import { isoAvecDecalage } from '@/utils/dateLocale'

beforeEach(() => { api.post.mockReset() })

describe('isoAvecDecalage — l’heure saisie, avec son décalage', () => {
  it('« AAAA-MM-JJTHH:mm » local → ISO 8601 avec décalage, même instant', () => {
    const iso = isoAvecDecalage('2026-11-13T08:30')
    expect(iso).toMatch(/^2026-11-13T08:30:00[+-]\d{2}:\d{2}$/)
    expect(new Date(iso).getTime()).toBe(new Date('2026-11-13T08:30').getTime())
  })

  it('vide ou invalide → null (rien n’est inventé)', () => {
    expect(isoAvecDecalage('')).toBeNull()
    expect(isoAvecDecalage(null)).toBeNull()
    expect(isoAvecDecalage('pas une date')).toBeNull()
  })
})

describe('lmsSeancesService.createSeance', () => {
  it('POST /lms/seances avec la charge reçue ; rend la séance créée', async () => {
    api.post.mockResolvedValue({ success: true, data: { id: 42 } })
    const charge = { titre: 'Révision', date_seance: '2026-11-13T08:30:00+00:00' }
    expect(await lmsSeancesService.createSeance(charge)).toEqual({ id: 42 })
    expect(endpoints.lms.seances.store).toMatch(/\/lms\/seances$/)
    expect(api.post).toHaveBeenCalledWith(endpoints.lms.seances.store, charge)
  })

  it('2xx sans « success: true » → rejet (pas de faux succès)', async () => {
    api.post.mockResolvedValue({ success: false })
    const err = await lmsSeancesService.createSeance({}).catch((e) => e)
    expect(err).toBeInstanceOf(Error)
  })
})

describe('refus motivés de S-matière — catalogue, définitifs', () => {
  const refus = (status, reason) => ({ response: { status, data: { reason, message: 'TEXTE SERVEUR' } } })

  for (const [reason, status, mot] of [
    ['class_out_of_scope', 404, /classe/i],
    ['subject_out_of_scope', 404, /matière/i],
    ['subject_not_in_class_program', 422, /programme/i],
  ]) {
    it(`${reason} : message du catalogue, jamais le texte du serveur`, () => {
      const n = normalizeError(refus(status, reason))
      expect(n.userMessage).toMatch(mot)
      expect(n.userMessage).not.toContain('TEXTE SERVEUR')
      expect(messageForReason(reason)).toBe(n.userMessage)
    })

    it(`${reason} sur une réponse « success: false » : définitif (pas de Réessayer)`, () => {
      expect(estPannePassagere(invalidResponseError('création', { reason }))).toBe(false)
    })
  }
})
