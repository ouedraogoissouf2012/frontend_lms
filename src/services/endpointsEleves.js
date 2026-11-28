/**
 * Les chemins du DOSSIER d'un élève (front#664, back #1797), sortis de `endpoints.js` pour la garde de taille
 * (≤300 lignes), comme `endpointsEcoleLocale.js`. `endpoints.js` les étale tels quels : les appelants écrivent
 * `endpoints.eleves.*`, et la garde de contrat (scripts/lint-api-contract.mjs) les lit par l'import de la carte.
 *
 * `eleve` est l'id LOCAL du compte. La lecture vaut pour les deux sortes d'école ; l'écriture, pour la gestion d'une
 * école autonome. Chemins RÉELS de la spec : SANS préfixe /lms.
 */
export const endpointsEleves = {
  eleves: {
    dossier: (eleve) => `/eleves/${eleve}/dossier`,
    tuteurs: (eleve) => `/eleves/${eleve}/tuteurs`,
    tuteurDeLEleve: (eleve, tuteur) => `/eleves/${eleve}/tuteurs/${tuteur}`,
    tuteur: (tuteur) => `/tuteurs/${tuteur}`,
  },
}
