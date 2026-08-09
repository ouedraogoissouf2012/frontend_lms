/**
 * Test unitaire de `extractList` (#232) — extraction robuste d'un tableau depuis
 * les 3 formes d'enveloppe API du projet (paginée / plate / tableau nu).
 *
 * Régression du bug : la liste des quiz s'affichait toujours vide parce que
 * `Array.isArray(response)` était faux (response = corps `{success,data}`).
 */
import { describe, it, expect } from 'vitest'
import { extractList } from '@/utils/apiList'

describe('extractList — extraction depuis l\'enveloppe API', () => {
  it('extrait le tableau d\'un paginator Laravel sous data.data', () => {
    const response = {
      success: true,
      data: { current_page: 1, total: 2, data: [{ id: 1 }, { id: 2 }] },
    }
    expect(extractList(response)).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('extrait le tableau d\'une réponse plate {success, data:[...]}', () => {
    const response = { success: true, data: [{ id: 3 }] }
    expect(extractList(response)).toEqual([{ id: 3 }])
  })

  it('renvoie tel quel un tableau nu (défensif)', () => {
    expect(extractList([{ id: 4 }])).toEqual([{ id: 4 }])
  })

  it('renvoie [] pour une enveloppe sans data', () => {
    expect(extractList({ success: true })).toEqual([])
  })

  it('renvoie [] pour null / undefined', () => {
    expect(extractList(null)).toEqual([])
    expect(extractList(undefined)).toEqual([])
  })

  it('renvoie [] si data.data n\'est pas un tableau', () => {
    expect(extractList({ success: true, data: { data: 'oops' } })).toEqual([])
  })
})
