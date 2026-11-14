/**
 * Service du code d'inscription (#391) : chemins RÉELS de la spec du backend
 * (`/classes`, `/classes/{classe}/code-inscription` SANS préfixe /lms, `/me/inscriptions`).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const del = vi.fn()
// C43 : `defaults.transformResponse` du client, que `rejoindre` prolonge pour sa seule requête.
// Hissé : la fabrique de vi.mock le lit à son exécution, avant l'initialisation du module.
const parDefaut = vi.hoisted(() => (data) => data)
vi.mock('@/services/api', () => ({ default: {
  get: (...a) => get(...a), post: (...a) => post(...a), delete: (...a) => del(...a),
  defaults: { transformResponse: [parDefaut] },
} }))

import { enrolmentCodesService } from '@/services/enrolmentCodes'

beforeEach(() => {
  get.mockReset(); post.mockReset(); del.mockReset()
  get.mockResolvedValue({ success: true, data: [] })
  post.mockResolvedValue({ success: true, data: {} })
  del.mockResolvedValue({ success: true, data: null })
})

describe('enrolmentCodesService (#391)', () => {
  it('liste les classes locales : GET /classes paginé', async () => {
    await enrolmentCodesService.listClasses(2)
    expect(get).toHaveBeenCalledWith('/classes', { params: { page: 2, per_page: 25 } })
  })

  it('émet un code : POST /classes/{id}/code-inscription, sans corps', async () => {
    await enrolmentCodesService.emettre(5)
    expect(post).toHaveBeenCalledWith('/classes/5/code-inscription')
  })

  it('retire un code : DELETE /classes/{id}/code-inscription', async () => {
    await enrolmentCodesService.retirer(5)
    expect(del).toHaveBeenCalledWith('/classes/5/code-inscription')
  })

  // C43 (migration déclarée) : l'appel porte un 3e argument, le `transformResponse` local qui relève le statut.
  it("rejoint une classe : POST /me/inscriptions { code }", async () => {
    post.mockResolvedValue({ corps: { success: true, data: {} }, statut: 201 })
    await enrolmentCodesService.rejoindre('AB23CD')
    expect(post).toHaveBeenCalledWith('/me/inscriptions', { code: 'AB23CD' }, expect.objectContaining({ transformResponse: expect.any(Array) }))
  })

  it('C43 : le transform local garde les transformations du client, puis relève le statut d’un 2xx SEULEMENT', async () => {
    post.mockResolvedValue({ corps: { success: true, data: {} }, statut: 200 })
    expect((await enrolmentCodesService.rejoindre('AB23CD')).dejaInscrit).toBe(true)
    const fns = post.mock.calls[0][2].transformResponse
    expect(fns[0]).toBe(parDefaut)
    const releve = fns.at(-1)
    expect(releve({ a: 1 }, {}, 201)).toEqual({ corps: { a: 1 }, statut: 201 })
    expect(releve({ a: 1 }, {}, 200)).toEqual({ corps: { a: 1 }, statut: 200 })
    // Piège : axios transforme aussi les réponses d'erreur ; leur corps (et son `reason`) reste intact.
    const refus = { success: false, reason: 'enrolment_not_active' }
    expect(releve(refus, {}, 409)).toBe(refus)
    expect(releve(refus, {}, 404)).toBe(refus)
  })
})
