/**
 * front#693 (contrat back #1773) : la diffusion des résultats d'une évaluation, en un seul lieu.
 *
 * - Les modes d'ouverture du corrigé, tels que l'enseignant les choisit.
 * - L'état du corrigé tel que l'élève le lit. Il vient de l'API (`correction_available`,
 *   `correction_available_at`) et du mode, jamais d'un délai calculé par le poste : l'ancien
 *   « 7 jours après la remise » n'existe plus côté serveur.
 */

export const MODES_DU_CORRIGE = Object.freeze([
  { valeur: 'with_results', libelle: 'Avec la publication des notes' },
  { valeur: 'after_close', libelle: 'À la fermeture de l’évaluation' },
  { valeur: 'at_date', libelle: 'À une date choisie' },
  { valeur: 'never', libelle: 'Jamais' },
])

/** Le plancher que le serveur applique à tous les modes. */
export const PLANCHER_DU_CORRIGE = 'Le corrigé n’ouvre jamais avant la fermeture de l’évaluation pour tous.'

function dateLisible(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/**
 * L'état du corrigé d'une copie, pour l'élève.
 * @param {object} copie la réponse de `GET /evaluations/{id}/my-submission`
 * @returns {{ ouvert: boolean, message: string }}
 */
export function etatDuCorrige(copie) {
  if (copie?.correction_available === true) {
    return { ouvert: true, message: 'Le corrigé est disponible.' }
  }
  if (copie?.correction_available_at) {
    return { ouvert: false, message: `Le corrigé ouvrira le ${dateLisible(copie.correction_available_at)}.` }
  }
  const evaluation = copie?.evaluation ?? {}
  if (evaluation.correction_release === 'never') {
    return { ouvert: false, message: 'Pas de corrigé prévu pour cette évaluation.' }
  }
  if ((evaluation.correction_release ?? 'with_results') === 'with_results' && evaluation.show_results === false) {
    return { ouvert: false, message: 'Le corrigé ouvrira avec la publication des notes.' }
  }

  return { ouvert: false, message: 'Le corrigé n’est pas encore daté : il ouvrira après la fermeture de l’évaluation.' }
}

/** Les notes de cette copie sont-elles publiées ? Lu sur l'évaluation, pas sur une note nulle. */
export function notesPubliees(copie) {
  return copie?.evaluation?.show_results !== false
}
