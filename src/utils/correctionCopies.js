/**
 * Correction d'une copie par l'enseignant (lot CORR) : logique PURE. Source : `data.evaluation` de
 * `GET /evaluations/{id}/results-by-class`, l'évaluation ENRICHIE (ses questions et toutes ses copies,
 * avec `answers` et `manual_points`), entraînements compris.
 *
 * La règle du bouton « Noter » est celle du serveur, ni plus large ni plus étroite (lms_backend 685695df) :
 * - `role:enseignant,coordinateur,admin` (routes/api/evaluation.php:47) ;
 * - `ChecksEvaluationOwnership::checkEvaluationOwnership` (:72-86) : jamais un coordinateur ;
 * - `mayActOnRoutedEvaluation` (:141-164) : l'admin ; sinon l'auteur local (`enseignant_id`) ; sinon
 *   l'identité KLASSCI (`klassci_enseignant_id`). Le front ne reçoit pas cette dernière : une ligne
 *   d'avant D72 (sans `enseignant_id`) est donc déléguée au serveur, son refus traduit (déclaré).
 */
import { hasRole, isTeacher, ROLES } from '@/constants/roles'
import { toId } from '@/utils/toId'

const ENTRAINEMENT = '[PRACTICE]'

/** Une tentative d'entraînement (le serveur la marque dans `feedback`, comme /my-grades). */
export const estEntrainement = (copie) => String(copie?.feedback ?? '').startsWith(ENTRAINEMENT)

/** Les questions notées à la main : les dissertations (la seule correction que /grade attend). */
export const questionsANoter = (evaluation) => (evaluation?.questions ?? []).filter((q) => q.type === 'dissertation')

/**
 * Les copies à montrer, sans les entraînements ; l'élève est nommé par `student_id` (le compte local que
 * `resultats[].etudiant_id` porte aussi), « — » sinon.
 */
export function copiesDeLEvaluation(evaluation, resultats = []) {
  const noms = new Map((resultats ?? []).map((r) => [toId(r.etudiant_id), r.etudiant_nom_complet || r.etudiant_nom]))
  return (evaluation?.submissions ?? [])
    .filter((copie) => !estEntrainement(copie))
    .map((copie) => ({ ...copie, nom: noms.get(toId(copie.student_id)) || '—' }))
}

/** À corriger : une copie remise (`soumis`) d'une évaluation à dissertation. */
export const aCorriger = (copie, evaluation) => copie?.status === 'soumis' && questionsANoter(evaluation).length > 0

/** La règle serveur de `/grade` (voir l'en-tête du module). */
export function peutNoter(user, evaluation) {
  if (!user || !evaluation) return false
  if (hasRole(user, ROLES.COORDINATEUR)) return false
  if (hasRole(user, ROLES.ADMIN)) return true
  if (!isTeacher(user)) return false
  if (evaluation.enseignant_id != null) return toId(evaluation.enseignant_id) === toId(user.id)
  // Ligne d'avant D72 : seule l'identité KLASSCI la rattache ; le front ne la reçoit pas → le serveur tranche.
  return evaluation.klassci_enseignant_id != null
}

/** Copie notable : remise (`soumis`) ou déjà corrigée (`corrige`, renotation), jamais en cours ni hors délai. */
export const copieNotable = (copie) => copie?.status === 'soumis' || copie?.status === 'corrige'

/**
 * Points saisis, une erreur par dissertation hors de [0, points de la question].
 * @param {Object<string, number|string>} points
 * @param {Array<{id: number, points: number}>} questions les dissertations
 * @returns {Object<string, string>}
 */
export function validerPoints(points, questions) {
  const erreurs = {}
  for (const q of questions) {
    const brut = points?.[q.id]
    const n = typeof brut === 'number' ? brut : Number(String(brut ?? '').replace(',', '.'))
    const max = Number(q.points)
    if (brut === '' || brut === null || brut === undefined || Number.isNaN(n) || n < 0 || n > max) {
      erreurs[q.id] = `Indiquez des points entre 0 et ${max}.`
    }
  }
  return erreurs
}
