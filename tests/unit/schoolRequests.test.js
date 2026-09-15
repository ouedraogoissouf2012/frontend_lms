import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

import api from '@/services/api'
import { schoolRequestsService } from '@/services/schoolRequests'

describe('schoolRequestsService (#393)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.get.mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: {} })
  })

  it('liste page 1', async () => {
    await schoolRequestsService.list(1)
    expect(api.get).toHaveBeenCalledWith('/admin/school-requests', {
      params: { page: 1, per_page: 25 },
    })
  })

  it('valider avec slug', async () => {
    await schoolRequestsService.validate(7, 'atelier')
    expect(api.post).toHaveBeenCalledWith('/admin/school-requests/7/validate', { slug: 'atelier' })
  })

  it('valider sans slug', async () => {
    await schoolRequestsService.validate(7, '')
    expect(api.post).toHaveBeenCalledWith('/admin/school-requests/7/validate', {})
  })

  it('refuser avec motif', async () => {
    await schoolRequestsService.refuse(7, 'Dossier incomplet pour ouvrir.')
    expect(api.post).toHaveBeenCalledWith('/admin/school-requests/7/refuse', {
      motif_refus: 'Dossier incomplet pour ouvrir.',
    })
  })
})
