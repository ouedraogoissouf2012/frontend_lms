/**
 * Tests de la logique pure des matières (#28 — décomposition AdminMatieres.vue).
 */
import { describe, it, expect } from 'vitest'
import {
  filterMatieres,
  groupMatieresByNiveau,
  computeMatieresStats,
  getMatiereFilieres,
  getMatiereNiveaux
} from '@/utils/matieres'

const M = (over = {}) => ({ nom: 'Maths', code: 'MAT', description: '', combinaisons: [], ...over })

describe('utils/matieres — filterMatieres', () => {
  const data = [
    M({ nom: 'Algèbre', code: 'ALG' }),
    M({ nom: 'Physique', code: 'PHY', combinaisons: [{ filiere: { id: 1 }, niveau: { id: 10 } }] })
  ]
  it('recherche sur nom/code/description', () => {
    expect(filterMatieres(data, { search: 'alg' }).map(m => m.code)).toEqual(['ALG'])
    expect(filterMatieres(data, { search: 'phy' })).toHaveLength(1)
  })
  it('filtre par filiere (comparaison souple)', () => {
    expect(filterMatieres(data, { filiere_id: '1' }).map(m => m.code)).toEqual(['PHY'])
  })
  it('filtre par niveau', () => {
    expect(filterMatieres(data, { niveau_id: 10 }).map(m => m.code)).toEqual(['PHY'])
  })
  it('sans filtre : tout', () => {
    expect(filterMatieres(data, {})).toHaveLength(2)
  })
})

describe('utils/matieres — groupMatieresByNiveau', () => {
  it('fallback : groupe vide par niveau si aucune matière', () => {
    const res = groupMatieresByNiveau([], [{ id: 1, nom: 'L1' }])
    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({ matieres: [], totalHeures: 0, totalSeances: 0 })
  })
  it('regroupe par niveau valide avec totaux', () => {
    const matieres = [
      M({ code: 'A', heures_total: 10, nb_seances_programmees: 2, combinaisons: [{ niveau: { id: 1, code: 'L1' } }] }),
      M({ code: 'B', heures_total: 5, nb_seances_programmees: 1, combinaisons: [{ niveau: { id: 1, code: 'L1' } }] })
    ]
    const res = groupMatieresByNiveau(matieres, [])
    expect(res).toHaveLength(1)
    expect(res[0].matieres).toHaveLength(2)
    expect(res[0].totalHeures).toBe(15)
    expect(res[0].totalSeances).toBe(3)
  })
  it('matière sans combinaison → groupe « Sans niveau » en fin', () => {
    const matieres = [
      M({ code: 'A', combinaisons: [{ niveau: { id: 1, code: 'L1' } }] }),
      M({ code: 'B', combinaisons: [] })
    ]
    const res = groupMatieresByNiveau(matieres, [])
    expect(res[res.length - 1].niveau.nom).toBe('Sans niveau')
  })
})

describe('utils/matieres — computeMatieresStats', () => {
  it('total / heures / séances', () => {
    const data = [
      M({ heures_total: 10, nb_seances_programmees: 2 }),
      M({ heures_total: 20, nb_seances_programmees: 3 })
    ]
    expect(computeMatieresStats(data)).toEqual({ total: 2, totalHeures: 30, totalSeances: 5 })
  })
})

describe('utils/matieres — getMatiereFilieres / getMatiereNiveaux', () => {
  it('filières uniques (nom prioritaire sur code)', () => {
    const m = M({ combinaisons: [{ filiere: { nom: 'Info' } }, { filiere: { code: 'INF' } }, { filiere: { nom: 'Info' } }] })
    expect(getMatiereFilieres(m)).toEqual(['Info', 'INF'])
  })
  it('niveaux uniques', () => {
    const m = M({ combinaisons: [{ niveau: { nom: 'L1' } }, { niveau: { nom: 'L1' } }] })
    expect(getMatiereNiveaux(m)).toEqual(['L1'])
  })
  it('vide si pas de combinaisons', () => {
    expect(getMatiereFilieres(M())).toEqual([])
    expect(getMatiereNiveaux(M())).toEqual([])
  })
})
