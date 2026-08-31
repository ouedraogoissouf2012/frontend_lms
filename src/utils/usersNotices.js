/**
 * Avertissements de l'écran Utilisateurs — fonction PURE, dérivée de la MESURE.
 *
 * Extrait de `useAdminUsers` (garde des 300 lignes) : la formulation des messages
 * est de la présentation, pas de l'orchestration, et se teste sans monter de
 * composant. Aucun état n'est stocké — les avertissements se déduisent de ce qui
 * a été mesuré, ce qui évite l'arbitrage insoluble « quel échec tue la page ? ».
 *
 * @param {{counts: {classes: number|null, enseignants: number|null, classesOk: number|null},
 *   hasClasses: boolean, hasEnseignants: boolean, rosterForbidden: boolean}} state
 * @returns {string[]}
 */
export function buildUsersNotices({ counts, hasClasses, hasEnseignants, rosterForbidden }) {
  const { classes: nbClasses, enseignants: nbEnseignants, classesOk } = counts
  const out = []

  if (nbClasses === null) {
    out.push(hasClasses
      ? 'Classes : actualisation impossible, la liste peut être périmée.'
      : "Les classes n'ont pas pu être chargées : le filtre par classe est indisponible.")
  }
  if (nbEnseignants === null) {
    out.push(hasEnseignants
      ? 'Enseignants : actualisation impossible, la liste peut être périmée.'
      : "Les enseignants n'ont pas pu être chargés.")
  }

  // Refus de droits : cause distincte d'un échec, et sans issue par un réessai.
  if (rosterForbidden) {
    out.push(
      "Vous n'avez pas les droits de consulter la liste nominative des étudiants. "
      + "L'effectif ci-dessus reste exact ; demandez cet accès à l'administrateur KLASSCI."
    )
    return out
  }

  // Échec TOTAL et PARTIEL sont la même phrase, à un chiffre près.
  // `classesOk === null` = chargement non encore mesuré : on ne dit rien.
  if (nbClasses !== null && nbClasses > 0 && classesOk !== null && classesOk < nbClasses) {
    out.push(
      `Étudiants : ${classesOk} classe(s) sur ${nbClasses} chargée(s) — la liste nominative `
      + "est incomplète. L'effectif affiché ci-dessus, lui, reste exact."
    )
  }
  return out
}
