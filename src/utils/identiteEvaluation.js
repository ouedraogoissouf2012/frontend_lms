/**
 * Identité d'une évaluation : sa classe, sa matière, son enseignant (D72-c, D-c1). UNE règle, pour
 * tous les lecteurs (calendrier, coordinateur, résultats, noms affichés) :
 * - elle se lit sur les champs À PLAT, jamais sur les objets imbriqués `classe`/`matiere`/`enseignant`,
 *   dont l'`id` change de sens selon la route (nul ou local dans la liste du personnel, local chez
 *   l'élève) ;
 * - `klassci_* ?? local` : d'après E1 (`EvaluationRecord`), une évaluation KLASSCI remplit `klassci_*`
 *   et laisse `classe_id`/`matiere_id` nuls, une évaluation locale fait l'inverse. Pour l'enseignant,
 *   les deux peuvent être remplis dans une école KLASSCI : KLASSCI passe d'abord, comme ses
 *   référentiels. Même ordre que le serveur (E3) ;
 * - dans une école, toutes les lignes sont de la famille de sa source : ces ids se comparent à ceux
 *   des référentiels et des séances sans connaître le mode de l'école.
 * Lecture seule : aucun champ `klassci_*` n'est jamais écrit (D132).
 *
 * @param {Object} evaluation
 * @returns {string} l'id canonique (`toId`), ou '' si l'évaluation n'en porte aucun
 */
import { toId } from './toId'

export const idClasse = (evaluation) => toId(evaluation?.klassci_classe_id ?? evaluation?.classe_id)

export const idMatiere = (evaluation) => toId(evaluation?.klassci_matiere_id ?? evaluation?.matiere_id)

export const idEnseignant = (evaluation) => toId(evaluation?.klassci_enseignant_id ?? evaluation?.enseignant_id)
