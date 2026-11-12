/**
 * D72-a (ARRÊT 1 validé) — les refus de création, de mise à jour et de publication d'une évaluation
 * (E1 #1023, C14 #1024, C16 #1025 encore en brouillon) ont leur message du catalogue, jamais le texte
 * du serveur (D0), et sont DÉFINITIFS (pas de « Réessayer »). Les services d'écriture ne rendent pas
 * un faux succès : une 2xx sans « success: true » rejette.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/services/api', () => ({ default: api }))

import evaluationService from '@/services/evaluation'
import { normalizeError, messageForReason, invalidResponseError } from '@/services/errorHandler'
import { estPannePassagere } from '@/utils/pannePassagere'

const SERVEUR = 'TEXTE SERVEUR'
const refus = (status, reason, extra = {}) => ({ response: { status, data: { success: false, message: SERVEUR, reason, ...extra } } })

describe('catalogue — motifs des évaluations', () => {
  for (const [reason, status, mot] of [
    ['klassci_teacher_identity_missing', 403, /fiche d.enseignant/i],
    ['teacher_not_assigned', 403, /désigné/i],
    ['klassci_scheduling_required', 422, /programmée/i],
    ['identifier_out_of_scope', 422, /établissement/i],
    ['publish_via_dedicated_route', 422, /Publier/],
    ['evaluation_without_questions', 422, /au moins une question/i],
  ]) {
    it(`${reason} : message du catalogue, définitif`, () => {
      const n = normalizeError(refus(status, reason))
      expect(n.userMessage).toMatch(mot)
      expect(n.userMessage).not.toContain(SERVEUR)
      expect(messageForReason(reason)).toBe(n.userMessage)
      expect(estPannePassagere(invalidResponseError('évaluation', { reason }))).toBe(false)
    })
  }

  it('publish_via_dedicated_route porte aussi `errors` : le motif l’emporte, aucun message de champ', () => {
    const n = normalizeError(refus(422, 'publish_via_dedicated_route', { errors: { is_published: [SERVEUR] } }))
    expect(n.userMessage).toMatch(/Publier/)
    expect(n.fieldErrors).toBeNull()
  })
})

describe('services d’écriture — pas de faux succès', () => {
  beforeEach(() => {
    for (const f of Object.values(api)) f.mockReset()
  })

  for (const [nom, verbe, appel] of [
    ['createEvaluation', 'post', () => evaluationService.createEvaluation({ titre: 'X' })],
    ['updateEvaluation', 'put', () => evaluationService.updateEvaluation(3, { duree_minutes: 30 })],
    ['publishEvaluation', 'post', () => evaluationService.publishEvaluation(3)],
    ['deleteEvaluation', 'delete', () => evaluationService.deleteEvaluation(3)],
  ]) {
    it(`${nom} : « success: false » rejette ; « success: true » rend la réponse`, async () => {
      api[verbe].mockResolvedValue({ success: false })
      expect(await appel().catch((e) => e)).toBeInstanceOf(Error)
      api[verbe].mockResolvedValue({ success: true, data: { id: 3 } })
      expect(await appel()).toEqual({ success: true, data: { id: 3 } })
    })
  }
})
