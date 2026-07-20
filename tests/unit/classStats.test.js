import { describe, expect, it } from 'vitest'
import {
  enrichTeacherClasses,
  getAssignedClassIds,
  getClassCapacity,
  getClassMatiereCount,
  getClassStudentCount
} from '@/utils/classStats'

describe('classStats (#100)', () => {
  it('derive les compteurs depuis les champs de liste sans roster', () => {
    const classe = { places_occupees: 12, places_totales: 28 }
    expect(getClassStudentCount(classe)).toBe(12)
    expect(getClassCapacity(classe, 12)).toBe(28)
  })

  it('utilise effectif comme compteur et garde une capacite fallback', () => {
    expect(getClassStudentCount({ effectif: 34 })).toBe(34)
    expect(getClassCapacity({}, 34)).toBe(34)
  })

  it('ignore les valeurs vides avant de choisir un compteur fallback', () => {
    expect(getClassStudentCount({ places_occupees: null, nb_etudiants: 18 })).toBe(18)
    expect(getClassCapacity({ places_totales: '', capacite: 24 }, 18)).toBe(24)
  })

  it('collecte les classes rattachees depuis plusieurs formes de matieres', () => {
    const ids = getAssignedClassIds([
      { classes: [{ id: 5 }] },
      { classe_ids: [6] },
      { klassci_classe_id: '7' }
    ])

    expect([...ids].sort()).toEqual(['5', '6', '7'])
  })

  it('filtre les classes et compte les matieres liees quand le lien existe', () => {
    const classes = [
      { id: 5, nb_etudiants: 18 },
      { id: 6, nb_etudiants: 22 }
    ]
    const matieres = [
      { id: 1, classes: [{ id: 5 }] },
      { id: 2, classe_id: 5 }
    ]

    expect(enrichTeacherClasses(classes, matieres)).toEqual([
      {
        id: 5,
        nb_etudiants: 18,
        places_occupees: 18,
        places_totales: 30,
        nb_matieres: 2
      }
    ])
  })

  it('compte les matieres par combinaison filiere/niveau sans multiplier le total global', () => {
    const classe = { id: 5, filiere: { id: 1 }, niveau: { id: 2 } }
    const matieres = [
      { id: 10, combinaisons: [{ filiere: { id: 1 }, niveau: { id: 2 } }] },
      { id: 11, combinaisons: [{ filiere: { id: 1 }, niveau: { id: 3 } }] },
      { id: 12, combinaisons: [{ filiere: { id: 9 }, niveau: { id: 2 } }] }
    ]

    expect(getClassMatiereCount(classe, matieres)).toBe(1)
  })

  it('retourne zero si aucune matiere ne porte de rattachement exploitable', () => {
    expect(getClassMatiereCount({ id: 5 }, [{ id: 1 }, { id: 2 }])).toBe(0)
  })
})
