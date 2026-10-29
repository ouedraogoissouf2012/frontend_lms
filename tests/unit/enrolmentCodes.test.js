/**
 * Service du code d'inscription (#391) : chemins RÉELS de la spec du backend
 * (`/classes`, `/classes/{classe}/code-inscription` SANS préfixe /lms, `/me/inscriptions`).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const del = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...a) => get(...a), post: (...a) => post(...a), delete: (...a) => del(...a) } }))

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

  it("rejoint une classe : POST /me/inscriptions { code }", async () => {
    await enrolmentCodesService.rejoindre('AB23CD')
    expect(post).toHaveBeenCalledWith('/me/inscriptions', { code: 'AB23CD' })
  })
})
