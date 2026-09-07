/**
 * Frontière lms* (#296) : les méthodes-listes dé-wrappent l'enveloppe en tableau
 * canonique UNE fois (comme klassciStructure), pour que les consommateurs ne
 * dé-wrappent plus. `api` est mocké ; `extractList` (réel) fait le travail.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))
vi.mock('@/services/api', () => ({ default: { get: (...a) => getMock(...a) } }))

import { lmsTeachersService } from '@/services/lmsTeachers'
import { lmsMatieresService } from '@/services/lmsMatieres'
import { lmsSeancesService } from '@/services/lmsSeances'

describe('frontière lms* — dé-wrap d\'enveloppe en tableau (#296)', () => {
  beforeEach(() => getMock.mockReset())

  it('getEnseignants : enveloppe nommée { data: { enseignants: [...] } } → tableau', async () => {
    getMock.mockResolvedValue({ success: true, data: { enseignants: [{ id: 1 }] } })
    expect(await lmsTeachersService.getEnseignants()).toEqual([{ id: 1 }])
  })

  it('getEnseignants(withDetails) préserve les champs imbriqués de chaque enseignant', async () => {
    getMock.mockResolvedValue({ success: true, data: { enseignants: [{ id: 1, matieres: [{ id: 9 }] }] } })
    const out = await lmsTeachersService.getEnseignants(true)
    expect(out[0].matieres).toEqual([{ id: 9 }])
  })

  it('getMyMatieres : enveloppe plate { data: [...] } → tableau', async () => {
    getMock.mockResolvedValue({ success: true, data: [{ id: 2 }] })
    expect(await lmsMatieresService.getMyMatieres()).toEqual([{ id: 2 }])
  })

  it('getMyTeachingSeances : enveloppe nommée { data: { seances: [...] } } → tableau', async () => {
    getMock.mockResolvedValue({ success: true, data: { seances: [{ id: 3 }] } })
    expect(await lmsSeancesService.getMyTeachingSeances()).toEqual([{ id: 3 }])
  })

  it('tableau nu → renvoyé tel quel (défensif)', async () => {
    getMock.mockResolvedValue([{ id: 4 }])
    expect(await lmsMatieresService.getMyMatieres()).toEqual([{ id: 4 }])
  })

  it('forme non reconnue → []', async () => {
    getMock.mockResolvedValue({ success: false })
    expect(await lmsSeancesService.getMyTeachingSeances()).toEqual([])
  })
})
