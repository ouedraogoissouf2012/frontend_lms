/**
 * Tableau de bord enseignant, tuile « Étudiants Totaux » (R4, point front 1) : le total suit UNE règle
 * d'effectif, celle de `measureClassStudentCount`. Avant, `effectifMesure` en tenait une seconde, plus
 * étroite (`places_occupees | nb_etudiants | students_count`), et ignorait `effectif_actuel`, la clé
 * que rend la source locale des classes de l'enseignant (`LocalTeacherClassesReader`, lot 2) : la
 * tuile restait « — » dans une école créée depuis le LMS.
 */
import { describe, it, expect } from 'vitest'
import { deriveTeacherCounters } from '@/utils/teacherDashboard'
import { measureClassStudentCount } from '@/utils/classMeasures'

const total = (classes) => deriveTeacherCounters({ classes }, null).total_etudiants

describe('deriveTeacherCounters — total_etudiants par measureClassStudentCount', () => {
  it('effectif_actuel (source locale) est une mesure : 12 + 8 = 20', () => {
    expect(total([{ id: 1, effectif_actuel: 12 }, { id: 2, effectif_actuel: 8 }])).toBe(20)
  })

  it('un 0 réel reste 0 ; une classe sans mesure rend le total non mesuré (null)', () => {
    expect(total([{ id: 1, effectif_actuel: 0 }])).toBe(0)
    expect(total([{ id: 1, effectif_actuel: 5 }, { id: 2 }])).toBeNull()
  })

  it('une seule règle : le total est la somme de measureClassStudentCount, quelle que soit la clé', () => {
    const classes = [
      { id: 1, places_occupees: 3 },
      { id: 2, nombre_etudiants: 4 },
      { id: 3, effectif_actuel: 5 },
      { id: 4, etudiants: [{ id: 'a' }, { id: 'b' }] },
    ]
    expect(total(classes)).toBe(classes.reduce((s, c) => s + measureClassStudentCount(c), 0))
    expect(total(classes)).toBe(14)
  })

  it('aucune classe → non mesuré', () => {
    expect(total([])).toBeNull()
    expect(deriveTeacherCounters({}, null).total_etudiants).toBeNull()
  })
})
