/**
 * Les quatre indicateurs du tableau de bord enseignant (#371).
 *
 * ## Le défaut, mesuré à l'écran le 2026-09-10
 *
 * `DashboardActivityWidgets.vue` affichait **quatre tuiles à zéro en
 * permanence** :
 *
 *     Étudiants Totaux 0 · Leçons Créées 0 · Séances du Jour 0 · Évaluations en Cours 0
 *
 * Il lisait `statistiques.total_etudiants`, `statistiques.total_lecons`,
 * `statistiques.seances_aujourdhui` et `statistiques.evaluations_en_cours` —
 * **aucune de ces quatre clés n'existe** dans `me/teacher-dashboard`, dont
 * `statistiques` ne porte que `{ heures, evaluations }`. Le `|| 0` convertissait
 * chaque absence en zéro.
 *
 * Le plus parlant : « Leçons Créées : 0 » alors que `/api/dashboard/teacher`
 * répondait `lessons.total = 2` **dans le même chargement de page**.
 *
 * ## Pourquoi le repli existant ne sauvait pas
 *
 * `buildTeacherDashboardFallback` calcule bien ces valeurs, mais il est
 * conditionné à `hasDashboardContent()` faux. KLASSCI rendant 6 matières et
 * 27 évaluations, le contenu est jugé présent et le repli **ne s'exécute
 * jamais** dans le cas nominal. Du bon code qui ne tourne pas.
 *
 * ## Ce que chaque compteur peut valoir, et pourquoi
 *
 * | Compteur | Source | Mesurable ? |
 * |---|---|---|
 * | `total_lecons` | LMS `/dashboard/teacher` → `lessons.total` | oui — c'est SA table |
 * | `evaluations_en_cours` | `evaluations[].programmation.window.is_open` | oui |
 * | `total_etudiants` | *aucune* — les classes ne portent aucun effectif | non → `null` |
 * | `seances_aujourdhui` | *aucune* — `prochaines_seances` est toujours vide (#739) | non → `null` |
 *
 * `null` s'affiche « — » via `formatCount`. Un `0` affirmerait une mesure qu'on
 * n'a pas : c'est la règle déjà écrite dans `utils/classStats.js`.
 */
import { describe, it, expect } from 'vitest'
import { TEACHER_DASHBOARD } from '../fixtures/klassci/teacherDashboard'
import { deriveTeacherCounters } from '@/utils/teacherDashboard'

/** Charge `data` de `/api/dashboard/teacher` (LMS), mesurée le même jour. */
const LMS = {
  lessons: { total: 2, published: 0, draft: 2, top_lessons: [] },
  students: { active_last_7_days: 0 },
  quizzes: { total: 0, to_grade: 0 },
  forum: { unresolved_topics: 0 },
}

describe('compteurs du tableau de bord enseignant (#371)', () => {
  it('prend les leçons chez le LMS, seul à les détenir', () => {
    // KLASSCI ne connaît pas la table `lessons` : la lui demander donnait 0
    // alors que le LMS répondait 2 dans le MÊME chargement de page.
    const c = deriveTeacherCounters(TEACHER_DASHBOARD, LMS)

    expect(c.total_lecons).toBe(2)
  })

  it('dérive les évaluations en cours de la fenêtre d’ouverture', () => {
    const attendu = TEACHER_DASHBOARD.evaluations
      .filter((e) => e?.programmation?.window?.is_open).length

    const c = deriveTeacherCounters(TEACHER_DASHBOARD, LMS)

    expect(c.evaluations_en_cours).toBe(attendu)
    expect(typeof c.evaluations_en_cours).toBe('number')
  })

  it('rend « non mesuré » là où aucune source n’existe', () => {
    const c = deriveTeacherCounters(TEACHER_DASHBOARD, LMS)

    // Les classes de cette charge ne portent aucun effectif.
    expect(TEACHER_DASHBOARD.classes[0]).not.toHaveProperty('places_occupees')
    expect(c.total_etudiants).toBeNull()

    // `prochaines_seances` est toujours vide cote KLASSCI (#739).
    expect(TEACHER_DASHBOARD.prochaines_seances).toHaveLength(0)
    expect(c.seances_aujourdhui).toBeNull()
  })

  it('ne confond JAMAIS un vrai zéro avec une absence', () => {
    const sansLecon = { ...LMS, lessons: { total: 0 } }

    const c = deriveTeacherCounters(TEACHER_DASHBOARD, sansLecon)

    // Le LMS a repondu : zero lecons est une MESURE.
    expect(c.total_lecons).toBe(0)
    // Le LMS n'a pas repondu : on ne sait pas.
    expect(deriveTeacherCounters(TEACHER_DASHBOARD, null).total_lecons).toBeNull()
  })

  it('un effectif, quand la charge en porte un, est compté', () => {
    // Certaines charges (fusion avec /proxy/classes) portent `places_occupees`.
    // Le compteur doit alors mesurer, pas rendre `null`.
    const avecEffectifs = {
      ...TEACHER_DASHBOARD,
      classes: [
        { ...TEACHER_DASHBOARD.classes[0], places_occupees: 6 },
        { ...TEACHER_DASHBOARD.classes[1], places_occupees: 5 },
      ],
    }

    expect(deriveTeacherCounters(avecEffectifs, LMS).total_etudiants).toBe(11)
  })

  it('une charge absente ne fabrique aucun chiffre', () => {
    const c = deriveTeacherCounters(null, null)

    expect(c.total_lecons).toBeNull()
    expect(c.total_etudiants).toBeNull()
    expect(c.seances_aujourdhui).toBeNull()
    expect(c.evaluations_en_cours).toBeNull()
  })
})
