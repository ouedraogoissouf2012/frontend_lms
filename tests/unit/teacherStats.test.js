/**
 * `mapTeacherStats` confronté à la charge KLASSCI RÉELLE.
 *
 * La fixture ci-dessous n'est pas inventée : elle est la réponse mesurée le
 * 2026-09-09 sur `presentation.klassci.com`, avec le jeton de l'enseignant
 * `prof.bede.test` (6 matières, 4 classes, 27 évaluations, 105 séances
 * programmées, 0 séance à venir).
 *
 * C'est le point de tout ce fichier. L'ancien test de `useTeacherStats`
 * fournissait `statistiques: { total_etudiants, total_lecons,
 * corrections_effectuees, visio_effectuees, messages_forum }` — **cinq clés
 * que KLASSCI n'envoie pas**. Il était vert sur une charge qui n'existe pas,
 * pendant que l'écran affichait six zéros en production.
 */
import { describe, it, expect } from 'vitest'
import { mapTeacherStats } from '@/utils/teacherStats'

/** Réponse `data` de `me/teacher-dashboard`, mesurée le 2026-09-09. */
const KLASSCI_REEL = {
  enseignant: { id: 9, nom_complet: 'BEDE ABEL TEST', email: 'bede@gmail.com', photo_url: null },
  matieres: [
    { id: 1, nom: 'Marketing digital', coefficient: 1, nb_seances_programmees: 39 },
    { id: 2, nom: 'Algorithme', coefficient: 1, nb_seances_programmees: 43 },
    { id: 3, nom: 'Anglais', coefficient: 1, nb_seances_programmees: 17 },
    { id: 92, nom: 'Equilibres Concurrentiels', coefficient: 3, nb_seances_programmees: 2 },
    { id: 96, nom: "Elements d'Optimisation", coefficient: 3, nb_seances_programmees: 2 },
    { id: 98, nom: 'Economie du Developpement', coefficient: 3, nb_seances_programmees: 2 },
  ],
  classes: [
    { id: 1, name: 'B2 COM', libelle: null, filiere: { id: 1, name: 'BATIMENT' }, niveau: { id: 1, nom: 'BTS 1ere ANNEE', code: '1A' } },
    { id: 2, name: 'B3 COM', libelle: null, filiere: { id: 2, name: 'Economie et Gestion' }, niveau: { id: 3, nom: 'Licence 2ème année', code: 'LIN456' } },
    { id: 4, name: '1ère année BTS Génie Civil Option Bâtiment', libelle: null, filiere: { id: 1, name: 'BATIMENT' }, niveau: { id: 1, nom: 'BTS 1ere ANNEE', code: '1A' } },
    { id: 5, name: 'ROSTAN BTS BATIMENT', libelle: null, filiere: { id: 1, name: 'BATIMENT' }, niveau: { id: 1, nom: 'BTS 1ere ANNEE', code: '1A' } },
  ],
  prochaines_seances: [],
  evaluations: new Array(27).fill(null).map((_, i) => ({ id: i + 1 })),
  statistiques: {
    heures: { total_seances: 105, seances_effectuees: 0 },
    evaluations: { total_programmees: 27, a_corriger: 0 },
  },
}

/** Réponse `data` de `/dashboard/teacher` (LMS), mesurée le même jour. */
const LOCAL_REEL = {
  lessons: { total: 1, published: 0, draft: 1, top_lessons: [] },
  students: { active_last_7_days: 0 },
  quizzes: { total: 0, published: 0, to_grade: 0, total_attempts: 0, average_score: 0 },
  forum: { unresolved_topics: 0, unresolved_topics_list: [] },
}

describe('mapTeacherStats — charge KLASSCI réelle', () => {
  it('rend les compteurs que les sources détiennent vraiment', () => {
    const s = mapTeacherStats(KLASSCI_REEL, LOCAL_REEL)

    expect(s.nb_matieres).toBe(6)
    expect(s.nb_classes).toBe(4)
    expect(s.nb_evaluations).toBe(27)
  })

  it('lit les séances dans `statistiques.heures`, pas dans une liste absente', () => {
    // L'ancien mapping faisait `d.seances?.length` : la clé s'appelle
    // `prochaines_seances`, et elle est vide alors que 105 sont programmées.
    const s = mapTeacherStats(KLASSCI_REEL, LOCAL_REEL)

    expect(s.nb_seances).toBe(105)
  })

  it('prend les leçons chez le LMS, seul à les détenir', () => {
    // `lessons` est une table du LMS ; la demander à KLASSCI donnait 0 alors
    // que le LMS répondait 1 dans le MÊME chargement de page.
    const s = mapTeacherStats(KLASSCI_REEL, LOCAL_REEL)

    expect(s.nb_lecons).toBe(1)
  })

  it('distingue un vrai zéro d’une mesure absente', () => {
    const s = mapTeacherStats(KLASSCI_REEL, LOCAL_REEL)

    // Vrai zéro : KLASSCI le dit explicitement.
    expect(s.nb_corrections).toBe(0)

    // Non mesuré : aucune source ne le porte. `null`, jamais `0` — un `0`
    // affirmerait une mesure qu'on n'a pas.
    expect(s.nb_etudiants).toBeNull()
    expect(s.nb_visio).toBeNull()
    expect(s.nb_messages_forum).toBeNull()
  })

  it('normalise les classes : plus aucun objet brut ne peut atteindre l’écran', () => {
    const s = mapTeacherStats(KLASSCI_REEL, LOCAL_REEL)

    expect(s.par_classe).toHaveLength(4)
    for (const classe of s.par_classe) {
      // Le composant rendait `classe.niveau` — un OBJET — d'où du JSON brut
      // affiché à l'utilisateur. Après normalisation, tout champ destiné à
      // l'affichage doit être scalaire ou nul.
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
    const s = mapTeacherStats({ ...KLASSCI_REEL, matieres: [], evaluations: [] }, LOCAL_REEL)

    expect(s.nb_matieres).toBe(0)
    expect(s.nb_evaluations).toBe(0)
  })

  it('AUCUNE des clés de l’ancienne fixture n’existe dans la charge réelle', () => {
    // Ce test est le garde-fou du fichier : si quelqu'un « rétablit » l'une de
    // ces clés dans une fixture, c'est qu'il réinvente une charge KLASSCI.
    const clesInventees = [
      'total_etudiants', 'total_lecons', 'corrections_effectuees',
      'visio_effectuees', 'messages_forum',
    ]

    for (const cle of clesInventees) {
      expect(KLASSCI_REEL.statistiques).not.toHaveProperty(cle)
    }
    expect(KLASSCI_REEL).not.toHaveProperty('seances')
    expect(KLASSCI_REEL).not.toHaveProperty('lessons')
  })
})
