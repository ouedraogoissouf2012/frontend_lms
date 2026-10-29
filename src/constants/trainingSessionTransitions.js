/**
 * Transitions d'une période de formation — COPIE de l'ADR-845-01 du backend
 * (`docs/adr/2026-09-22-845-01-transitions-de-la-periode.md`, appliquée par
 * `TrainingSessionTransitionService`).
 *
 * ## DETTE NOMMÉE — ce fichier doit disparaître
 *
 * Le serveur ne dit pas encore quelles transitions sont possibles pour une période :
 * le front recopie donc son graphe, pour ne proposer que des boutons légitimes.
 * C'est une seconde source de vérité. Elle disparaît quand
 * ouedraogoissouf2012/lms_backend#956 sera livrée (la liste publiera
 * `transitions_possibles`) : les boutons liront alors la réponse.
 *
 * Le serveur reste l'AUTORITÉ : un refus (409 hors graphe, 422 sans date de début)
 * prime toujours sur cette table. `tests/unit/trainingSessionTransitions.test.js`
 * épingle la copie contre ELLE-MÊME (un littéral) : il ne voit pas un changement du
 * graphe côté serveur — c'est précisément le trou que #956 fermera.
 *
 * `purgee` n'apparaît nulle part : aucune route n'y mène (ADR-845-01).
 */

/** Action → statuts de départ autorisés. */
export const TRANSITIONS = Object.freeze({
  publier: Object.freeze(['brouillon']),
  annuler: Object.freeze(['brouillon', 'publiee']),
  cloturer: Object.freeze(['publiee']),
  archiver: Object.freeze(['cloturee', 'annulee']),
})

/** Ordre d'affichage des boutons. */
const ORDRE = Object.freeze(['publier', 'annuler', 'cloturer', 'archiver'])

/** Libellés des boutons. */
export const LIBELLES_TRANSITION = Object.freeze({
  publier: 'Publier',
  annuler: 'Annuler',
  cloturer: 'Clôturer',
  archiver: 'Archiver',
})

/** Opérations qui ne se défont pas (ADR-845-01 : « se recrée, ne se ressuscite pas »). */
export const IRREVERSIBLES = Object.freeze(['annuler', 'archiver'])

/**
 * Actions proposables pour une période, d'après son statut seul.
 * @param {{status?: string}|null} periode
 * @returns {string[]}
 */
export function transitionsPermises(periode) {
  const status = periode?.status
  return ORDRE.filter((action) => TRANSITIONS[action].includes(status))
}

/**
 * Raison pour laquelle une action permise reste bloquée, ou null.
 * Publier exige une date de début (ADR-845-01) : sans elle, le serveur répond 422.
 * @param {{starts_on?: string|null}|null} periode
 * @param {string} action
 * @returns {string|null}
 */
export function raisonBlocage(periode, action) {
  if (action === 'publier' && !periode?.starts_on) return 'Ajoutez une date de début pour publier.'
  return null
}
