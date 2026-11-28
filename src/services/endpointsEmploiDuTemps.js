/**
 * Les chemins des EMPLOIS DU TEMPS d'une école autonome (#676, lms_backend#1669), sortis de `endpoints.js` pour la
 * garde de taille (≤300 lignes). `endpoints.js` les étale tels quels : les appelants écrivent
 * `endpoints.emploisDuTemps.*`, et la garde de contrat (scripts/lint-api-contract.mjs) les lit par l'import de la carte.
 */
const RACINE = '/lms/emplois-du-temps'

export const endpointsEmploiDuTemps = {
  emploisDuTemps: {
    liste: RACINE,
    alertes: `${RACINE}/alertes`,
    un: (id) => `${RACINE}/${id}`,
    lignes: (id) => `${RACINE}/${id}/lignes`,
    generer: (id) => `${RACINE}/${id}/generer`,
    copier: (id) => `${RACINE}/${id}/copier`,
  },
}
