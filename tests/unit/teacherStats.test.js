/**
 * `mapTeacherStats` confronté à la charge KLASSCI RÉELLE.
 *
 * La charge n'est pas écrite ici : elle est importée de
 * `tests/fixtures/klassci/`, où elle a été **capturée** le 2026-09-09 sur
 * `presentation.klassci.com` avec le jeton de `prof.bede.test`.
 *
 * C'est le point de tout ce fichier. L'ancien test de `useTeacherStats`
 * fournissait `statistiques: { total_etudiants, total_lecons,
 * corrections_effectuees, visio_effectuees, messages_forum }` — **cinq clés
 * que KLASSCI n'envoie pas**. Il était vert sur une charge qui n'existe pas,
 * pendant que l'écran affichait six zéros en production.
 *
 * Les comptes sont assertés **contre la fixture elle-même**, jamais contre un
 * nombre recopié : la fixture réduit les listes longues en nombre d'éléments,
 * et un nombre en dur y dériverait au premier ajustement.
 */
import { describe, it, expect } from 'vitest'
import { mapTeacherStats } from '@/utils/teacherStats'
import { CLES_INEXISTANTES, TEACHER_DASHBOARD } from '../fixtures/klassci/teacherDashboard'

/** Charge `data` de `/dashboard/teacher` (LMS), mesurée le même jour. */
const LMS_REEL = {
  lessons: { total: 1, published: 0, draft: 1, top_lessons: [] },
  students: { active_last_7_days: 0 },
  quizzes: { total: 0, published: 0, to_grade: 0, total_attempts: 0, average_score: 0 },
  forum: { unresolved_topics: 0, unresolved_topics_list: [] },
}

describe('mapTeacherStats — charge KLASSCI réelle', () => {
  it('rend les compteurs que les sources détiennent vraiment', () => {
    const s = mapTeacherStats(TEACHER_DASHBOARD, LMS_REEL)

    expect(s.nb_matieres).toBe(TEACHER_DASHBOARD.matieres.length)
    expect(s.nb_classes).toBe(TEACHER_DASHBOARD.classes.length)
    expect(s.nb_evaluations).toBe(TEACHER_DASHBOARD.evaluations.length)
  })

  it('lit les séances dans `statistiques.heures`, pas dans une liste absente', () => {
    // L'ancien mapping faisait `d.seances?.length` : la clé s'appelle
    // `prochaines_seances`, et elle est VIDE alors que 105 sont programmées.
    const s = mapTeacherStats(TEACHER_DASHBOARD, LMS_REEL)

    expect(TEACHER_DASHBOARD.prochaines_seances).toHaveLength(0)
    expect(s.nb_seances).toBe(105)
  })

  it('prend les leçons chez le LMS, seul à les détenir', () => {
    // `lessons` est une table du LMS ; la demander à KLASSCI donnait 0 alors
    // que le LMS répondait 1 dans le MÊME chargement de page.
    const s = mapTeacherStats(TEACHER_DASHBOARD, LMS_REEL)

    expect(s.nb_lecons).toBe(1)
  })

  it('distingue un vrai zéro d’une mesure absente', () => {
    const s = mapTeacherStats(TEACHER_DASHBOARD, LMS_REEL)

    // Vrai zéro : KLASSCI le dit explicitement.
    expect(s.nb_corrections).toBe(0)

    // Non mesuré : aucune source ne le porte. `null`, jamais `0` — un `0`
    // affirmerait une mesure qu'on n'a pas.
    expect(s.nb_etudiants).toBeNull()
    expect(s.nb_visio).toBeNull()
    expect(s.nb_messages_forum).toBeNull()
  })

  it('normalise les classes : plus aucun objet brut ne peut atteindre l’écran', () => {
    const s = mapTeacherStats(TEACHER_DASHBOARD, LMS_REEL)

    expect(s.par_classe).toHaveLength(TEACHER_DASHBOARD.classes.length)
    for (const classe of s.par_classe) {
      // Le composant rendait `classe.niveau` — un OBJET — d'où du JSON brut
      // affiché à l'utilisateur. Après normalisation, tout champ destiné à
      // l'affichage est scalaire ou nul.
      expect(typeof classe.nom).toBe('string')
      expect(classe.niveau === null || typeof classe.niveau === 'string').toBe(true)
      expect(typeof classe.places_occupees === 'number' || classe.places_occupees === null).toBe(true)
      expect(typeof classe.nb_matieres === 'number' || classe.nb_matieres === null).toBe(true)
    }
  })

  it('une source absente ne fabrique aucun chiffre', () => {
    const s = mapTeacherStats(null, null)

    expect(s.nb_matieres).toBeNull()
    expect(s.nb_seances).toBeNull()
    expect(s.nb_lecons).toBeNull()
    expect(s.par_classe).toEqual([])
  })

  it('une liste réellement vide vaut zéro, pas « non mesuré »', () => {
    const s = mapTeacherStats({ ...TEACHER_DASHBOARD, matieres: [], evaluations: [] }, LMS_REEL)

    expect(s.nb_matieres).toBe(0)
    expect(s.nb_evaluations).toBe(0)
  })

  it('AUCUNE des clés de l’ancienne fixture n’existe dans la charge réelle', () => {
    // Garde-fou du fichier : si quelqu'un « rétablit » l'une de ces clés dans
    // une fixture, c'est qu'il réinvente une charge KLASSCI.
    for (const cle of CLES_INEXISTANTES) {
      expect(TEACHER_DASHBOARD.statistiques).not.toHaveProperty(cle)
      expect(TEACHER_DASHBOARD).not.toHaveProperty(cle)
    }
  })
})
