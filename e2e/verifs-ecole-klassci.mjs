import { chiffre } from './ecran.mjs'

// Assertions de VALEUR de l'école KLASSCI (K2, D481) : les valeurs viennent du jeu FICTIF du faux
// KLASSCI « école » (e2e/klassci-ecole/jeu.mjs) : 2 classes de 3 élèves, l'enseignant a 2 matières
// (Mathematiques et Francais K E2E) dans les 2 classes, 1 enseignant au catalogue de l'école.
// Un vert y exige que l'écran DISE VRAI, pas seulement qu'il se rende.
//
// D499 : `admin_brut /admin/users` reste ROUGE, déclaré. Le compte au rôle brut `admin` est rangé
// sous ADMIN par le front (roles.js:35-49), mais `GET /admin/users` le refuse (role:coordinateur,
// superAdmin). La règle est confiée au back ; ce cas mesure l'incohérence, il ne la cache pas.

/** @param {object} _jeu - le jeu du parcours de l'école KLASSCI (ids fictifs) */
export function verifsEcoleKlassci(_jeu) {
  const classeK1 = {
    chiffres: [chiffre('Étudiants', 3), chiffre('Matières', 2)],
    // Les NOMS d'élèves sont dans l'onglet « Étudiants » (ClasseDetails.vue:42), pas dans la vue par défaut :
    // le parcours ne clique pas d'onglet. Corrigé après le run 43607420046 (une erreur de l'attente, déclarée).
    contient: ['Classe K1 E2E', 'Mathematiques K E2E', 'Francais K E2E'],
  }
  return {
    'enseignant /teacher/dashboard': { chiffres: [chiffre('Matières Enseignées', 2), chiffre('Classes', 2)] },
    'admin /admin/classes': {
      chiffres: [chiffre('Total Classes', 2), chiffre('Total Étudiants', 6)],
      contient: ['Classe K1 E2E', 'Classe K2 E2E'],
    },
    'admin /admin/users': {
      chiffres: [chiffre('Étudiants', 6, 'avant'), chiffre('Classes', 2, 'avant')],
      contient: ['Eleve K E2E', 'Eleve K2 Trois E2E'],
    },
    'admin /classes/:id': classeK1,
    'coordinateur /classes/:id': classeK1,
    'enseignant /classes/:id': classeK1,
    'etudiant /classes/:id': { chiffres: [chiffre('Matières', 2)], contient: ['Classe K1 E2E', 'Mathematiques K E2E'] },
  }
}
