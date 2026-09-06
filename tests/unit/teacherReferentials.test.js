import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getMatieres } = vi.hoisted(() => ({ getMatieres: vi.fn() }))
vi.mock('@/services/klassci', () => ({
  klassciService: { getMatieres: (...a) => getMatieres(...a) },
}))

import { fetchTeacherMatieres } from '@/services/teacherReferentials'

describe('fetchTeacherMatieres (#315 — source + forme canoniques de teacher_matieres)', () => {
  beforeEach(() => getMatieres.mockReset())

  it('retourne le tableau de getMatieres (déjà normalisé à la frontière #343)', async () => {
    getMatieres.mockResolvedValue([{ id: 1, nom: 'Maths' }, { id: 2, nom: 'Physique' }])
    expect(await fetchTeacherMatieres()).toEqual([{ id: 1, nom: 'Maths' }, { id: 2, nom: 'Physique' }])
  })

  it('déballe défensivement une enveloppe nommée { matieres: [...] }', async () => {
    getMatieres.mockResolvedValue({ matieres: [{ id: 3 }] })
    expect(await fetchTeacherMatieres()).toEqual([{ id: 3 }])
  })

  it('retourne [] quand getMatieres renvoie vide', async () => {
    getMatieres.mockResolvedValue([])
    expect(await fetchTeacherMatieres()).toEqual([])
  })

  // (La propagation d'erreur du helper est couverte indirectement par les
  // try/catch de `loadMatieres` dans les tests des 3 composables consommateurs.)
})
