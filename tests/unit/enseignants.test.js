/**
 * Tests de la logique pure des enseignants (#28 — AdminEnseignants.vue).
 */
import { describe, it, expect } from 'vitest'
import {
  getEnseignantClassesCount,
  getEnseignantUniqueClasses,
  computeEnseignantsStats
} from '@/utils/enseignants'

describe('utils/enseignants — getEnseignantClassesCount', () => {
  it('priorité aux statistiques backend', () => {
    expect(getEnseignantClassesCount({ statistiques: { total_classes: 5 } })).toBe(5)
  })
  it('fallback : classes uniques des matières', () => {
    const ens = {
      matieres: [
        { classes: [{ id: 1 }, { id: 2 }] },
        { classes: [{ id: 2 }, { id: 3 }] }
      ]
    }
    expect(getEnseignantClassesCount(ens)).toBe(3)
  })
  it('0 si aucune classe', () => {
    expect(getEnseignantClassesCount({})).toBe(0)
  })
})

describe('utils/enseignants — getEnseignantUniqueClasses', () => {
  it('dédoublonne par id', () => {
    const ens = {
      matieres: [
        { classes: [{ id: 1, nom: 'A' }, { id: 2, nom: 'B' }] },
        { classes: [{ id: 1, nom: 'A' }] }
      ]
    }
    expect(getEnseignantUniqueClasses(ens).map(c => c.id)).toEqual([1, 2])
  })
  it('[] si pas de matières', () => {
    expect(getEnseignantUniqueClasses({})).toEqual([])
    expect(getEnseignantUniqueClasses(null)).toEqual([])
  })
})

describe('utils/enseignants — computeEnseignantsStats', () => {
  it('totalMatieres / totalClasses / actifs', () => {
    const list = [
      { matieres: [{ classes: [{ id: 1 }] }, { classes: [{ id: 2 }] }] },
      { statistiques: { total_classes: 3 }, matieres: [{}] },
      { matieres: [], classes: [] } // inactif
    ]
    expect(computeEnseignantsStats(list)).toEqual({ totalMatieres: 3, totalClasses: 5, actifs: 2 })
  })
  it('robuste si entrée non-array', () => {
    expect(computeEnseignantsStats(null)).toEqual({ totalMatieres: 0, totalClasses: 0, actifs: 0 })
  })

  it('robuste si matières/classes imbriquées ne sont pas des tableaux (#13)', () => {
    const enseignant = { matieres: { id: 1 }, classes: { id: 2 } }

    expect(getEnseignantClassesCount(enseignant)).toBe(0)
    expect(getEnseignantUniqueClasses(enseignant)).toEqual([])
    expect(computeEnseignantsStats([enseignant])).toEqual({ totalMatieres: 0, totalClasses: 0, actifs: 0 })
  })

  it('ignore les classes nulles dans les matières (#13)', () => {
    const enseignant = { matieres: [null, { classes: [null, { id: 7, nom: 'L1' }] }] }

    expect(getEnseignantClassesCount(enseignant)).toBe(1)
    expect(getEnseignantUniqueClasses(enseignant)).toEqual([{ id: 7, nom: 'L1' }])
    expect(computeEnseignantsStats([null, enseignant])).toEqual({ totalMatieres: 1, totalClasses: 1, actifs: 1 })
  })
})
