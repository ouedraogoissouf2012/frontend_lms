import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn() },
}))

import api from '@/services/api'
import { extractAdminStatistics, getAdminStatistics } from '@/services/adminStatistics'

describe('adminStatistics (#383)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.get.mockResolvedValue({ data: { nb_enseignants: 1 } })
  })

  it('GET /admin/statistics', async () => {
    await getAdminStatistics()
    expect(api.get).toHaveBeenCalledWith('/admin/statistics')
  })

  it('extrait les compteurs du serveur, y compris un 0', () => {
    const out = extractAdminStatistics({
      success: true,
      data: {
        nb_enseignants: 1,
        nb_etudiants: 2,
        nb_seances_actives: 0,
        taux_presence: 0,
        extra: 'ignore',
      },
    })
    expect(out).toEqual({
      nb_enseignants: 1,
      nb_etudiants: 2,
      nb_seances_actives: 0,
      taux_presence: 0,
    })
  })

  it('null si payload vide', () => {
    expect(extractAdminStatistics(null)).toBeNull()
    expect(extractAdminStatistics({})).toBeNull()
  })
})
