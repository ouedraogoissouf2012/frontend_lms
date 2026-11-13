/**
 * Catalogue des motifs de refus (`reason` du serveur), extrait d'`errorHandler.js` pour qu'il
 * puisse grandir sans dépasser la taille d'un fichier (D72-a). Aucun changement de comportement :
 * `errorHandler` reste le seul consommateur et la seule API publique (`messageForReason`,
 * `refusMotive`, `normalizeError`, `invalidResponseError`). Imports RELATIFS (graphe contrat).
 */

/**
 * Motifs de refus (#391, ADR-906-01) : quand un même statut porte plusieurs sens, le
 * corps porte `reason`. Un motif CONNU devient une catégorie du catalogue ; un motif
 * inconnu est ignoré et le statut décide (fail-secure : jamais le texte du serveur).
 */
/**
 * Une entrée du catalogue : la catégorie (clé d'ERROR_MESSAGES) et son caractère TRANSITOIRE.
 * Transitoire : la cause peut passer d'elle-même (« Réessayez dans un instant », délai de
 * Retry-After) ; un nouvel essai a un sens. Sinon le motif est un refus définitif. C'est le SEUL
 * endroit qui le dit : un motif transitoire ajouté ici prend son délai ET garde « Réessayer ».
 */
function motif(categorie, { transitoire = false } = {}) {
  return Object.freeze({ categorie, transitoire })
}

export const REASONS = Object.freeze({
  enrolment_not_active: motif('enrolmentNotActive'),
  no_institution: motif('noInstitution'),
  account_quota_exceeded: motif('accountQuotaExceeded'),
  account_daily_cap_reached: motif('accountDailyCapReached'),
  institution_cap_reached: motif('institutionCapReached'),
  // #429 : contrat de POST /lms/seances/{id}/join. Un `reason` serveur est un identifiant de
  // contrat GLOBAL (BusinessException) : s'il prenait un autre sens ailleurs, ce serait un
  // défaut serveur. Catégories préfixées par leur contrat, aucune résolution par écran.
  not_enrolled: motif('visioNotEnrolled'),
  no_classe_id: motif('visioNoClasse'),
  visio_not_enabled: motif('visioNotEnabled'),
  // VisioStatusRefusal (serveur) : attendre (`visio_not_started`) ou renoncer (`visio_ended`).
  visio_not_started: motif('visioNotStarted'),
  visio_ended: motif('visioEnded'),
  teacher_not_owner: motif('visioTeacherNotOwner'),
  actor_not_authorized: motif('visioRoleRefused'),
  invalid_role: motif('visioRoleRefused'),
  tenant_not_resolved: motif('visioNoInstitution'),
  // #420 : 401 d'une route adossée à KLASSCI quand ce compte n'a AUCUN accès KLASSCI
  // (compte local, école autonome). Ni une session LMS morte, ni une session KLASSCI
  // expirée : se reconnecter n'y change rien (contrat `KlassciUnauthorized`).
  klassci_token_missing: motif('klassciTokenMissing'),
  // lms_backend #1011 : refus de démarrage d'une évaluation (POST /evaluations/{id}/start, 403).
  evaluation_window_closed: motif('evaluationWindowClosed'),
  evaluation_max_attempts: motif('evaluationMaxAttempts'),
  evaluation_retake_forbidden: motif('evaluationRetakeForbidden'),
  evaluation_offline_only: motif('evaluationOfflineOnly'),
  evaluation_window_unverifiable: motif('evaluationWindowUnverifiable', { transitoire: true }),
  // frontend_lms#426 : la panne KLASSCI se classe par son motif (le 503 canonique le porte), pas par
  // l'en-tête Retry-After, que le navigateur cache en cross-origin (`exposed_headers: []`).
  klassci_unavailable: motif('klassciUnavailable', { transitoire: true }),
  // D72-a : refus d'écriture d'une évaluation. E1 (#1023) : POST /evaluations ; C14 (#1024) : PUT ;
  // C16 (#1025, brouillon) : `evaluation_without_questions`, sans effet tant qu'il n'est pas fusionné.
  klassci_teacher_identity_missing: motif('evaluationTeacherIdentityMissing'),
  teacher_not_assigned: motif('evaluationTeacherNotAssigned'),
  klassci_scheduling_required: motif('evaluationSchedulingRequired'),
  identifier_out_of_scope: motif('evaluationIdentifierOutOfScope'),
  publish_via_dedicated_route: motif('evaluationPublishViaDedicatedRoute'),
  evaluation_without_questions: motif('evaluationWithoutQuestions'),
})

/** L'entrée du catalogue pour un `reason`, ou `null` (inconnu, absent, clé du prototype). */
export function entreeDuMotif(reason) {
  return typeof reason === 'string' && Object.hasOwn(REASONS, reason) ? REASONS[reason] : null
}
