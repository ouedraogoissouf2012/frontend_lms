/**
 * Les chemins du CALENDRIER DE L'ANNÉE (#678, lms_backend#1671), sortis de `endpoints.js` pour la garde de taille
 * (≤300 lignes). `endpoints.js` les étale tels quels : les appelants écrivent `endpoints.calendrier.*`, et la garde
 * de contrat (scripts/lint-api-contract.mjs) les lit par l'import de la carte.
 */
const RACINE = '/lms/calendrier'

export const endpointsCalendrier = {
  calendrier: {
    liste: RACINE,
    un: (id) => `${RACINE}/${id}`,
  },
}
