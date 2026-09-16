import { describe, expect, it, vi, beforeEach } from 'vitest'

const list = vi.fn()
const createProgram = vi.fn()
const createPeriod = vi.fn()
vi.mock('@/services/trainingSessions', () => ({
  trainingSessionsService: {
    list: (...a) => list(...a),
    createProgram: (...a) => createProgram(...a),
    createPeriod: (...a) => createPeriod(...a),
  },
}))

import { useAdminTrainingSessions, libellePhase } from '@/composables/useAdminTrainingSessions'

describe('useAdminTrainingSessions (#391)', () => {
  beforeEach(() => {
    list.mockReset()
    createProgram.mockReset()
    createPeriod.mockReset()
  })

  it('extrait la liste paginee', async () => {
    list.mockResolvedValue({
      data: [{ id: 1, libelle: 'Promo', status: 'brouillon', phase: 'a_venir' }],
      meta: { current_page: 1, last_page: 1 },
    })
    const api = useAdminTrainingSessions()
    await api.load(1)
    expect(api.periodes.value).toHaveLength(1)
    expect(libellePhase('a_venir')).toBe('À venir')
  })

  it('retient l id du programme cree', async () => {
    createProgram.mockResolvedValue({ data: { id: 12, titre: 'OHADA', version: 1 }, message: 'Programme créé.' })
    const api = useAdminTrainingSessions()
    await api.creerProgramme('OHADA', '')
    expect(api.dernierProgrammeId.value).toBe(12)
  })
})
