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
function motif(categorie, { transitoire = false, etatVide = false, information = false } = {}) {
  // `etatVide` : le motif dit une ABSENCE légitime (rien à montrer), rendue en information, pas en erreur.
  // `information` : le motif n'est pas un refus ; il accompagne une réponse réussie et se rend tel quel (#613).
  return Object.freeze({ categorie, transitoire, ...(etatVide && { etatVide }), ...(information && { information }) })
}

export const REASONS = Object.freeze({
  enrolment_not_active: motif('enrolmentNotActive'),
  // lms_backend#1115 (#620) : 409 des deux portes d'inscription par code, la classe a atteint sa capacité. Définitif.
  class_full: motif('classeComplete'),
  no_institution: motif('noInstitution'),
  // lms_backend#1275 (#656 b) : 403 de PUT /users/{user}/password, l'école tient ses mots de passe chez KLASSCI.
  password_managed_by_klassci: motif('motDePasseGereParKlassci'),
  // lms_backend#1739 (#711) : 403 de POST /auth/login, KLASSCI refuse le compte. Définitif ; l'écran de
  // connexion montre le motif de KLASSCI quand il en porte un (`messageConnexion`).
  klassci_account_refused: motif('compteRefuseParKlassci'),
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
  // La séance est passée (fin + 30 min, SeanceVisioEnricher::buildVisioWindow) : 409, verrouillée. Reçu au démarrage
  // et à l'entrée d'une visio, et à la modification de la séance (lms_backend#1121).
  seance_past: motif('seancePassee'),
  // Back #1103 : la classe d'une leçon hors des classes de sa matière (422).
  classe_hors_matiere: motif('lessonClasseHorsMatiere'),
  // lms_backend#1167 : le contenu d'une leçon (créer, modifier, publier, supprimer, chapitres, quiz) est réservé à
  // l'enseignant ; le coordinateur et l'admin d'école consultent (403 ; décisions du user, #601).
  lesson_content_teacher_only: motif('lessonContentTeacherOnly'),
  // lms_backend#1113 : une évaluation verrouillée (des copies remises) ne se modifie ni ne se supprime (409).
  evaluation_locked: motif('evaluationLocked'),
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
  // lms_backend #1037 (C28) : remise refusée hors délai (POST /evaluations/{id}/submit, 409). Définitif.
  evaluation_attempt_locked: motif('evaluationAttemptLocked'),
  // 404 de GET /lms/seances/my-classes (LMSSeancesListController::myClassesSeances) : l'élève n'a aucune
  // classe active. Un état vide honnête, pas une erreur (décision de la superviseure, E2E de la nuit).
  student_without_active_class: motif('eleveSansClasseActive', { etatVide: true }),
  // lms_backend #1060 : un coordinateur ne prévisualise que les évaluations terminées (preview:140-147).
  preview_requires_finished_evaluation: motif('previewRequiresFinishedEvaluation'),
  // D466 (D467) : 422 de POST/PUT /evaluations, une bonne réponse absente des options. Définitif.
  correct_answer_not_among_options: motif('bonneReponseOrpheline'),
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
  // D540 : POST /evaluations/{id}/sync-klassci, 422 quand aucune copie soumise ou corrigée n'existe.
  no_submission_to_sync: motif('syncAucuneCopieRemise'),
  // S-matière (lms_backend) : refus de POST /lms/seances, création d'une séance locale.
  class_out_of_scope: motif('seanceClasseHorsEtablissement'),
  subject_out_of_scope: motif('seanceMatiereHorsEtablissement'),
  subject_not_in_class_program: motif('seanceMatiereHorsProgramme'),
  // lms_backend#1676 (#683) : refus de GET /lms/classes/{id}/resultats, définitifs.
  class_not_taught: motif('resultatsClasseNonEnseignee'),
  not_in_class: motif('resultatsHorsDeLaClasse'),
  // lms_backend#1121 : refus de PUT /lms/seances/{id} (403 et 409), définitifs.
  seance_managed_by_klassci: motif('seanceGereeParKlassci'),
  seance_visio_active: motif('seanceVisioEnCours'),
  // lms_backend#1668 (#675) : le créneau chevauche une séance (409, `conflicts` la nomme), le forçage refusé
  // à l'enseignant (403), une fin qui ne suit pas le début final (422). Définitifs.
  seance_schedule_conflict: motif('seanceConflitHoraire'),
  conflict_override_forbidden: motif('seanceForcageInterdit'),
  seance_end_before_start: motif('seanceFinAvantDebut'),
  // lms_backend#922 (ADR-906-01) : un même statut, plusieurs sens, chacun son motif. Les deux bornes du 429 de
  // POST /school-requests : la minute par adresse (transitoire) et le plafond du jour (définitif).
  ip_quota_exceeded: motif('demandeEcoleQuotaAdresse', { transitoire: true }),
  school_requests_global_cap: motif('demandeEcolePlafondDuJour'),
  training_session_transition_not_allowed: motif('periodeTransitionInterdite'),
  // lms_backend#1651 (#658) : modifier, supprimer, désigner la période en cours. Définitifs.
  training_session_not_editable: motif('periodeNonModifiable'),
  training_session_published_needs_start: motif('periodePublieeSansDebut'),
  training_session_not_deletable: motif('periodeNonSupprimable'),
  training_session_not_publiee: motif('periodeNonPubliee'),
  // #660 (lms_backend#1653) : le code d'une matière, une matière employée dans une classe.
  subject_code_already_used: motif('matiereCodeDejaPris'),
  subject_in_use_in_class: motif('programmeMatiereEmployee'),
  // #673 (lms_backend#1666) : le profil et les disponibilités d'un enseignant. Définitifs.
  matricule_deja_pris: motif('matriculeDejaPris'),
  disponibilites_en_conflit: motif('disponibilitesEnConflit'),
  teacher_profile_managed_by_klassci: motif('profilGereParKlassci'),
  evaluation_attempt_not_started: motif('evaluationTentativeNonDemarree'),
  evaluation_submission_not_gradable: motif('evaluationCopieNonNotable'),
  // POST /knowledge-checks/{id}/start et /submit. Les `webhook_*` du même lot ne s'adressent qu'au serveur
  // d'enregistrement : aucun écran ne les reçoit, ils restent hors du catalogue.
  quiz_unavailable: motif('quizIndisponible'),
  quiz_max_attempts: motif('quizTentativesEpuisees'),
  quiz_attempt_conflict: motif('quizTentativeConcurrente'),
  quiz_attempt_already_submitted: motif('quizTentativeDejaRendue'),
  quiz_time_expired: motif('quizTempsEcoule'),
  // #599 : la remise d'un quiz de leçon (lms_backend#1075, KnowledgeCheckOpenAttempts), 409 et 422.
  attempt_not_open: motif('quizTentativeFermee'),
  quiz_changed_since_start: motif('quizModifieDepuisLeDebut'),
  answer_not_an_option_index: motif('quizReponseHorsOptions'),
  // 409 au démarrage ET à la remise d'une évaluation : la copie est déjà remise par une autre requête.
  evaluation_attempt_conflict: motif('evaluationCopieDejaRemise'),
  // 422 de POST /evaluations/{id}/sync-klassci : l'évaluation n'a pas de lien KLASSCI (école autonome).
  evaluation_not_linked_to_klassci: motif('syncEvaluationNonLiee'),
  // 409 de GET /lms/classes/local/{id} : une classe créée dans le LMS n'a pas de fiche KLASSCI.
  classe_local_only: motif('classeSansFicheKlassci'),
  // #605 (lms_backend#1184, PorteDuCatalogueLocal) : 403 sur le catalogue d'une école dont KLASSCI tient le
  // catalogue (programmes, sessions et leurs transitions, classes, matières, programme d'une classe, codes).
  catalogue_managed_by_klassci: motif('catalogueGereParKlassci'),
  // #632 (lms_backend#1521) : le code d'une classe est déjà employé dans l'établissement ; dit sous le champ du code.
  class_code_already_used: motif('classeCodeDejaEmploye'),
  // #659 (lms_backend#1652) : une classe archivée ne reçoit plus personne. Et le formateur d'un programme qui n'est
  // pas de l'école (lms_backend#1756).
  class_archived: motif('classeArchivee'),
  teacher_out_of_scope: motif('enseignantHorsEtablissement'),
  // #613 (lms_backend#808) : le 200 de POST /auth/forgot-password, le même pour un compte connu ou inconnu. Aucun n'est
  // un refus : KLASSCI tient le mot de passe ; le canal de courriel n'est pas posé ; un lien part si le compte existe.
  mot_de_passe_klassci: motif('motDePasseKlassci', { information: true }),
  reinitialisation_indisponible: motif('reinitialisationIndisponible', { information: true }),
  lien_envoye: motif('lienDeReinitialisationEnvoye', { information: true }),
})

/** Le `reason` dit-il un état vide (rien à montrer) plutôt qu'une erreur ? Seul le catalogue en décide. */
export function estEtatVide(reason) {
  return entreeDuMotif(reason)?.etatVide === true
}

/** Le `reason` accompagne-t-il une réponse réussie (une information, pas un refus) ? Seul le catalogue en décide. */
export function estInformation(reason) {
  return entreeDuMotif(reason)?.information === true
}

/** L'entrée du catalogue pour un `reason`, ou `null` (inconnu, absent, clé du prototype). */
export function entreeDuMotif(reason) {
  return typeof reason === 'string' && Object.hasOwn(REASONS, reason) ? REASONS[reason] : null
}
