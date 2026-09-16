import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

import api from '@/services/api'
import { trainingSessionsService } from '@/services/trainingSessions'

describe('trainingSessionsService (#391)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.get.mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: {} })
  })

  it('liste GET /training-sessions', async () => {
    await trainingSessionsService.list(1)
    expect(api.get).toHaveBeenCalledWith('/training-sessions', {
      params: { page: 1, per_page: 25 },
    })
  })

  it('cree un programme sans institution_id', async () => {
    await trainingSessionsService.createProgram({ titre: 'OHADA', description: '' })
    expect(api.post).toHaveBeenCalledWith('/programs', { titre: 'OHADA' })
  })

  it('ignore status et institution_id a la creation de periode', async () => {
    await trainingSessionsService.createPeriod({
      program_id: 3,
      libelle: 'Promo',
      status: 'publiee',
      institution_id: 99,
      starts_on: '',
    })
    expect(api.post).toHaveBeenCalledWith('/training-sessions', {
      program_id: 3,
      libelle: 'Promo',
    })
  })
})
