/**
 * Les chemins du PROFIL et des DISPONIBILITÉS d'un enseignant (#673, lms_backend#1666), sortis de `endpoints.js` pour
 * la garde de taille (≤300 lignes). `{id}` est l'id LOCAL du compte (`users.id`), dans les deux volets, jamais un id
 * KLASSCI. La garde de contrat (scripts/lint-api-contract.mjs) les lit par l'import de la carte.
 */
const RACINE = '/lms/enseignants'

export const endpointsProfilEnseignant = {
  enseignantsProfil: {
    profil: (id) => `${RACINE}/${id}/profil`,
    disponibilites: (id) => `${RACINE}/${id}/disponibilites`,
    exceptions: (id) => `${RACINE}/${id}/disponibilites/exceptions`,
    exception: (id, exceptionId) => `${RACINE}/${id}/disponibilites/exceptions/${exceptionId}`,
  },
}
