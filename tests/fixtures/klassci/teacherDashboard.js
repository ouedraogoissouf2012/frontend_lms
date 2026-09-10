/**
 * Charges KLASSCI **mesurées**, jamais écrites de mémoire.
 *
 * ## Pourquoi ce module existe
 *
 * Quinze fichiers de test écrivaient chacun sa propre charge KLASSCI à la
 * main. C'est quinze occasions de diverger de la réalité, et la divergence
 * s'est produite : la fixture de `useTeacherStats.test.js` inventait
 * `total_etudiants`, `total_lecons`, `corrections_effectuees`,
 * `visio_effectuees`, `messages_forum` et `seances` — **six clés que KLASSCI
 * n'envoie pas**.
 *
 * Le test était vert. L'écran affichait six zéros en production. Aucun outil
 * ne pouvait le voir : un test qui écrit lui-même sa donnée d'entrée ne peut
 * pas découvrir qu'elle est fausse.
 *
 * ## La règle
 *
 * Une charge n'entre ici que si elle a été **capturée** contre un KLASSCI
 * réel. Chaque entrée porte sa provenance : date, compte, endpoint. Une charge
 * écrite de mémoire — même par quelqu'un qui connaît bien l'API — est
 * exactement ce que ce module existe pour empêcher.
 *
 * Pour en ajouter une : appeler l'endpoint avec un vrai jeton, coller la
 * réponse, noter la provenance. Ne pas l'abréger « pour la lisibilité » : les
 * clés absentes d'un extrait sont indiscernables des clés absentes de l'API,
 * et c'est précisément la confusion qui a coûté cet écran.
 *
 * @see scripts/lint-klassci-fixtures.mjs — la garde qui refuse les charges inventées
 */

/**
 * `GET me/teacher-dashboard`.
 *
 * Provenance : `https://presentation.klassci.com/api/lms`, 2026-09-09,
 * jeton de l'enseignant `prof.bede.test` (`klassci_enseignant_id` 9).
 * 6 matières, 4 classes, 27 évaluations, 105 séances programmées, 0 à venir.
 *
 * Les listes longues sont réduites en NOMBRE d'éléments, jamais en NOMBRE DE
 * CLÉS : chaque élément conserve la forme exacte reçue.
 */
export const TEACHER_DASHBOARD = Object.freeze({
  enseignant: {
    id: 9,
    nom_complet: 'BEDE ABEL TEST',
    email: 'bede@gmail.com',
    photo_url: null,
  },
  matieres: [
    { id: 1, nom: 'Marketing digital', code: 'ID2345', description: null, coefficient: 1, couleur: '#00fbff', heures_total: 100, combinaisons: [], nb_seances_programmees: 39 },
    { id: 2, nom: 'Algorithme', code: 'ALG1', description: null, coefficient: 1, couleur: '#8800ff', heures_total: 120, combinaisons: [], nb_seances_programmees: 43 },
    { id: 3, nom: 'Anglais', code: 'ID5356', description: null, coefficient: 1, couleur: '#ff5900', heures_total: 70, combinaisons: [], nb_seances_programmees: 17 },
    { id: 92, nom: 'Equilibres Concurrentiels', code: 'EQC', description: null, coefficient: 3, couleur: '#00aa55', heures_total: 30, combinaisons: [], nb_seances_programmees: 2 },
    { id: 96, nom: "Elements d'Optimisation", code: 'OPT', description: null, coefficient: 3, couleur: '#aa0055', heures_total: 30, combinaisons: [], nb_seances_programmees: 2 },
    { id: 98, nom: 'Economie du Developpement', code: 'ECD', description: null, coefficient: 3, couleur: '#5500aa', heures_total: 30, combinaisons: [], nb_seances_programmees: 2 },
  ],
  classes: [
    { id: 1, name: 'B2 COM', libelle: null, filiere: { id: 1, name: 'BATIMENT' }, niveau: { id: 1, nom: 'BTS 1ere ANNEE', code: '1A' } },
    { id: 2, name: 'B3 COM', libelle: null, filiere: { id: 2, name: 'Economie et Gestion' }, niveau: { id: 3, nom: 'Licence 2ème année', code: 'LIN456' } },
    { id: 4, name: '1ère année BTS Génie Civil Option Bâtiment', libelle: null, filiere: { id: 1, name: 'BATIMENT' }, niveau: { id: 1, nom: 'BTS 1ere ANNEE', code: '1A' } },
    { id: 5, name: 'ROSTAN BTS BATIMENT', libelle: null, filiere: { id: 1, name: 'BATIMENT' }, niveau: { id: 1, nom: 'BTS 1ere ANNEE', code: '1A' } },
  ],

  // VIDE dans la réponse réelle, alors que `statistiques.heures.total_seances`
  // en déclare 105. Ce n'est pas un artefact de capture : c'est le défaut
  // KLASSCI suivi par l'issue backend #739, et toute fixture qui la
  // remplirait décrirait une API qui n'existe pas.
  prochaines_seances: [],

  evaluations: [
    {
      id: 46,
      titre: 'DEVOIR DE NIVEAU',
      description: 'DEVOIR DE NIVEAU',
      type: 'devoir',
      status: 'draft',
      matiere: { id: 1, nom: 'Marketing digital', code: 'ID2345' },
      classe: { id: 1, nom: 'B2 COM' },
      programmation: {
        date_evaluation: '2026-07-10T08:00:00+00:00',
        duree_minutes: 240,
        coefficient: '1.0',
        bareme: '20.00',
        window: {
          start_at: '2026-07-10T08:00:00+00:00',
          end_at: '2026-07-10T12:00:00+00:00',
          has_started: true,
          has_ended: true,
          is_open: false,
          time_left_minutes: 0,
        },
      },
      correction: { notes_saisies: 0, notes_attendues: 6, progression: 0, is_complete: false },
      lms_integration: { can_create_online: false, can_submit_notes: true },
    },
  ],

  // La forme EXACTE : deux blocs imbriqués, jamais de compteurs à plat.
  // C'est ici que la fixture inventée plaçait `total_etudiants`,
  // `total_lecons`, `corrections_effectuees`, `visio_effectuees` et
  // `messages_forum` — aucune de ces clés n'existe.
  statistiques: {
    heures: { total_seances: 105, seances_effectuees: 0 },
    evaluations: { total_programmees: 27, a_corriger: 0 },
  },
})

/**
 * Les clés qu'une fixture inventée avait ajoutées, et que KLASSCI n'envoie
 * pas. Exportées pour que les tests puissent verrouiller leur absence.
 *
 * @type {ReadonlyArray<string>}
 */
export const CLES_INEXISTANTES = Object.freeze([
  'total_etudiants',
  'total_lecons',
  'corrections_effectuees',
  'visio_effectuees',
  'messages_forum',
  'seances',
  'lessons',
])
