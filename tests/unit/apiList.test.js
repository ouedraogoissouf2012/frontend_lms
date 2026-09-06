/**
 * Test unitaire de `extractList` (#232) — extraction robuste d'un tableau depuis
 * les 3 formes d'enveloppe API du projet (paginée / plate / tableau nu).
 *
 * Régression du bug : la liste des quiz s'affichait toujours vide parce que
 * `Array.isArray(response)` était faux (response = corps `{success,data}`).
 */
import { describe, it, expect } from 'vitest'
import { extractList, pickList } from '@/utils/apiList'

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

  it('extrait un tableau nommé { classes: [...] }', () => {
    expect(extractList({ classes: [{ id: 5 }] }, ['classes'])).toEqual([{ id: 5 }])
  })

  it('extrait un tableau nommé sous data { data: { matieres: [...] } }', () => {
    expect(extractList({ success: true, data: { matieres: [{ id: 6 }] } }, ['matieres'])).toEqual([{ id: 6 }])
  })
})

describe('pickList — lecture de champ tableau d\'un objet (#296)', () => {
  it('renvoie le premier champ tableau parmi les clés', () => {
    const enseignant = { id: 1, matieres: [{ id: 7 }], classes: [{ id: 5 }] }
    expect(pickList(enseignant, ['matieres'])).toEqual([{ id: 7 }])
    expect(pickList(enseignant, ['classes'])).toEqual([{ id: 5 }])
  })

  it('respecte l\'ordre de précédence des clés', () => {
    expect(pickList({ lecons: [{ id: 2 }] }, ['lessons', 'lecons'])).toEqual([{ id: 2 }])
    expect(pickList({ lessons: [{ id: 1 }], lecons: [{ id: 2 }] }, ['lessons', 'lecons'])).toEqual([{ id: 1 }])
  })

  it('renvoie le fallback [] si aucune clé n\'est un tableau', () => {
    expect(pickList({ id: 1 }, ['matieres'])).toEqual([])
    expect(pickList({ matieres: 'oops' }, ['matieres'])).toEqual([])
  })

  it('renvoie le fallback pour null / non-objet', () => {
    expect(pickList(null, ['matieres'])).toEqual([])
    expect(pickList(undefined, ['matieres'])).toEqual([])
    expect(pickList('x', ['matieres'])).toEqual([])
  })

  it('accepte un fallback personnalisé', () => {
    expect(pickList({}, ['matieres'], null)).toBeNull()
  })

  it('ne dé-wrappe PAS une enveloppe (contrairement à extractList) : lecture de champ pure', () => {
    // { data: { matieres: [...] } } : pickList lit `.matieres` au 1er niveau (absent) → []
    expect(pickList({ data: { matieres: [{ id: 9 }] } }, ['matieres'])).toEqual([])
  })
})
