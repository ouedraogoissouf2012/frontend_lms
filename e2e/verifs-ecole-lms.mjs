import { chiffre } from './ecran.mjs'

// Assertions de VALEUR (D110) : sur les écrans dont le jeu connaît la réponse, un vert exige que
// l'écran DISE VRAI. Sans elles, un vert prouve seulement « rendu sans erreur » (constat du run 7 :
// « Leçons Créées 0 » pour un enseignant qui en a créé 3). Les valeurs viennent du montage
// (e2e/ecole-lms.ps1) : ens1 a 2 matières dans 2 classes (4 + 2 élèves, dont 1 rendu inactif),
// 3 leçons (publiée, brouillon, archivée), 1 séance demain, 1 sujet de forum ; ens2 a publié
// « Lecture suivie » dans la classe de l'élève 1.
/** @param {object} jeu - le jeu monté par e2e/ecole-lms.ps1 */
export function verifsEcoleLms(jeu) {
  return {
    'enseignant /teacher/dashboard': {
      chiffres: [chiffre('Matières Enseignées', 2), chiffre('Classes', 2), chiffre('Leçons Créées', 3), chiffre('Étudiants Totaux', [5, 6]),
        ...(jeu.seance ? [chiffre('Séances à venir', 1)] : [])],
    },
    'enseignant /teacher/lessons': {
      chiffres: [chiffre('Total', 3), chiffre('Publiées', 1), chiffre('Brouillons', 1), chiffre('Archivées', 1)],
      contient: ['Fractions, introduction', 'Fractions, exercices'],
      // D72 : « Mes leçons » ne montre pas les leçons d'un collègue.
      absent: ['Lecture suivie', 'Matière inconnue'],
    },
    'etudiant /student/courses': {
      contient: ['Fractions, introduction', 'Lecture suivie', '2 cours'],
      absent: ['Fractions, exercices', 'La cellule, ancien cours'],
    },
    'admin /admin/classes': {
      chiffres: [chiffre('Total Classes', 2), chiffre('Total Étudiants', [5, 6])],
      contient: ['6e A E2E', '5e B E2E'],
    },
    ...(jeu.sujet ? {
      'enseignant /forum': { contient: ['Question sur les fractions'] },
      'etudiant /forum': { contient: ['Question sur les fractions'] },
    } : {}),
    // Le parcours réel d'un admin d'école : ses comptes et ses codes d'inscription.
    'admin /admin/users': {
      // Sur cet écran, le chiffre est AU-DESSUS de son libellé.
      chiffres: [chiffre('Étudiants', [5, 6], 'avant'), chiffre('Enseignants', 2, 'avant'), chiffre('Classes', 2, 'avant')],
      contient: ['Enseignant Un E2E', 'Eleve 1 E2E'],
    },
    'admin /admin/enrolment-codes': { contient: ['6e A E2E', '5e B E2E', 'Code actif'] },
    // Le parcours réel d'un enseignant : sa séance et ses présences.
    ...(jeu.seance ? {
      'enseignant /seances/:id': { contient: ['Fractions, seance E2E'] },
      // L'historique ne liste que les séances dont la visio a DÉMARRÉ (SeancesHistoryQueryService :
      // `visio_started_at IS NOT NULL`). Le jeu n'en démarre aucune : l'écran doit le dire honnêtement.
      // (v3.2.1 attendait l'inverse : un faux rouge de l'outil, relevé le 10/11/2026.)
      'enseignant /attendance/seances': { contient: ['Aucune séance trouvée'] },
      'enseignant /attendance/seances/:seanceId': { contient: ['Mathematiques E2E'] },
    } : {}),
    // Le parcours réel d'un élève : la leçon publiée de sa classe, et son chapitre.
    'etudiant /student/lessons/:id': {
      contient: ['Fractions, introduction', ...(jeu.chapitre ? [jeu.chapitre] : [])],
      absent: jeu.chapitre ? ['Aucun contenu disponible'] : [],
      // Le chapitre est créé par l'enseignant par le produit : un refus est un écart de ce parcours.
      refus: jeu.manques?.chapitre ? [`création du chapitre refusée : ${jeu.manques.chapitre}`] : [],
    },
    // v3 — la classe 6e A (jeu.classes[0]) : 4 élèves (le 6e, rendu inactif, est en 5e B), 2 matières
    // (Mathematiques par ens1, Francais par ens2), vue par le personnel et par l'élève qui y est inscrit.
    ...Object.fromEntries(['admin', 'coordinateur', 'enseignant'].map((c) => [`${c} /classes/:id`, {
      chiffres: [chiffre('Étudiants', 4), chiffre('Matières', 2)],
      contient: ['6e A E2E', 'Mathematiques E2E', 'Francais E2E', 'Enseignant Un E2E', 'Enseignant Deux E2E'],
    }])),
    'etudiant /classes/:id': {
      chiffres: [chiffre('Matières', 2)],
      contient: ['6e A E2E', 'Mathematiques E2E', 'Enseignant Un E2E'],
    },
    // v3 — le sujet de forum créé par ens1, lu par lui et par l'élève de sa classe.
    ...(jeu.sujet ? Object.fromEntries(['enseignant', 'etudiant'].map((c) => [`${c} /forum/topics/:id`, {
      contient: ['Question sur les fractions', 'Sujet fictif cree par le job E2E', 'Enseignant Un E2E'],
    }])) : {}),
  }
}
