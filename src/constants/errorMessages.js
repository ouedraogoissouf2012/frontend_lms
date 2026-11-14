/**
 * Catalogue centralisé des messages d'erreur utilisateur (#20).
 *
 * Source unique, gelée (cohérent avec src/constants/roles.js), orientée utilisateur
 * (français, actionnable, sans jargon technique). Supprime la duplication des
 * « Erreur lors du chargement » et prépare l'i18n (structure plate catégorie → message,
 * transformable en catégorie → clé i18n sans toucher les appelants).
 *
 * Aucun de ces messages ne contient de détail technique d'infrastructure (§1.2).
 */
export const ERROR_MESSAGES = Object.freeze({
  auth: 'Votre session a expiré. Veuillez vous reconnecter.',
  forbidden: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  notFound: 'La ressource demandée est introuvable.',
  // 409 (#391) : l'état a changé entre l'affichage et l'action. Message NEUTRE : il
  // sert TOUS les 409 (ex. demande d'ouverture déjà tranchée), dont certains appelants
  // ne rechargent rien. Le message serveur n'est pas repris (fail-secure).
  conflict: "Cette action n'est plus possible dans l'état actuel.",
  // Complément que seul un appelant qui A RECHARGÉ avec succès peut ajouter.
  listeActualisee: 'La liste a été actualisée.',
  gone: 'Ce lien n\'est plus valable. Demandez-en un nouveau à votre administrateur.',
  validation: 'Certaines informations sont invalides. Veuillez vérifier votre saisie.',
  rateLimit: 'Trop de requêtes en peu de temps. Veuillez patienter quelques instants.',
  server: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
  network: 'Connexion impossible. Vérifiez votre connexion internet et réessayez.',
  // Distinct de `network` : la connexion fonctionne, c'est le serveur qui n'a pas
  // répondu dans le délai imparti. L'action utile n'est pas la même (réessayer
  // plus tard, vs vérifier sa connexion).
  timeout: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
  // #240 : erreurs spécifiques du proxy KLASSCI, distinguées par le back
  // (RendersKlassciProxyErrors) — messages actionnables (sans quoi les dashboards
  // KLASSCI restaient muets après expiration du token ou indisponibilité).
  klassciExpired: 'Votre session KLASSCI a expiré. Reconnectez-vous à KLASSCI pour actualiser ces données.',
  // Fin « Réessayez dans un instant. » : errorHandler la remplace par le délai de Retry-After.
  klassciUnavailable: 'Service KLASSCI temporairement indisponible. Réessayez dans un instant.',
  // #420 : constat, sans consigne de reconnexion — se reconnecter ne pose aucun accès.
  klassciTokenMissing: "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées.",
  // lms_backend #1011 : refus de démarrage d'une évaluation. `offline_only` ne suppose pas le mode :
  // le serveur dit seulement « is_online=false, pas de passage LMS » (EvaluationAttemptStateService).
  evaluationWindowClosed: 'Cette évaluation n’est pas ouverte en ce moment.',
  evaluationMaxAttempts: 'Vous avez utilisé toutes vos tentatives pour cette évaluation.',
  evaluationRetakeForbidden: 'Cette évaluation ne peut pas être reprise.',
  evaluationOfflineOnly: 'Cette évaluation ne se passe pas en ligne.',
  // lms_backend #1037 (C28) : 409 à la remise, échéance dépassée ; la copie est gardée, jamais notée.
  // Lot CORR : 409 de POST /evaluations/{id}/sync-klassci, une copie à dissertation n'est pas notée.
  syncDissertationNonNotee: 'Une copie à dissertation n’est pas encore notée : notez-la depuis « Notes et résultats » avant d’envoyer les notes à KLASSCI.',
  evaluationAttemptLocked: 'Le temps imparti est dépassé : votre copie est verrouillée. Vos réponses sont conservées, mais elle ne sera pas notée.',
  // Motif `student_without_active_class` : un état vide, affiché en information (jamais en alerte).
  eleveSansClasseActive: 'Vous n’êtes inscrit dans aucune classe active.',
  // lms_backend #1060 : 403 de GET /evaluations/{id}/preview, coordinateur sur une évaluation non terminée.
  previewRequiresFinishedEvaluation: 'Cette évaluation ne peut être prévisualisée qu’une fois terminée.',
  // lms_backend #1019 : 503 + Retry-After, KLASSCI ne rend pas la fenêtre de l'évaluation.
  evaluationWindowUnverifiable: 'La disponibilité de cette évaluation ne peut pas être vérifiée pour le moment. Réessayez dans un instant.',
  // #391, ADR-906-01 : motifs de refus des portes d'inscription par code.
  // 409 : l'adhésion existe mais n'est pas active (élève suspendu) : une décision de
  // l'établissement (StudentEnrolmentService), pas un code périmé. Régénérer le code
  // ne la lèverait pas et casserait celui de tous les autres élèves.
  enrolmentNotActive: "Votre inscription dans cette classe n'est pas active. Adressez-vous à votre établissement.",
  noInstitution: "Votre compte n'est rattaché à aucun établissement. Contactez votre administrateur.",
  accountQuotaExceeded: "Trop d'essais en peu de temps. Réessayez dans une minute.",
  accountDailyCapReached: "Vous avez atteint la limite d'essais pour aujourd'hui. Réessayez demain.",
  // 429 : plafond quotidien de codes ERRONÉS pour tout l'établissement (anti-devinette,
  // RejoindreParCodeService), pas un plafond d'inscriptions.
  institutionCapReached: "Trop de codes erronés ont été saisis aujourd'hui dans votre établissement. Réessayez demain.",
  // #429 : refus d'entrée en visio (POST /lms/seances/{id}/join, ParticipantValidationService).
  // Chaque message suit la CONDITION serveur, et son recours change vraiment quelque chose.
  // not_enrolled : l'élève n'est pas parmi les élèves ACTIFS de la classe de la séance.
  visioNotEnrolled: "Vous ne figurez pas parmi les élèves actifs de la classe de cette séance. Adressez-vous à votre établissement.",
  // no_classe_id : la séance n'a pas de classe (toute séance locale aujourd'hui) ; le
  // formateur ne peut pas la rattacher depuis l'écran : seul l'établissement le peut.
  visioNoClasse: "Cette séance n'est rattachée à aucune classe : la visioconférence n'est pas accessible. Adressez-vous à votre établissement.",
  visioNotEnabled: "La visioconférence n'est pas activée pour cette séance.",
  visioNotStarted: "La visioconférence n'a pas encore commencé. Attendez que l'enseignant la démarre.",
  visioEnded: 'La visioconférence est terminée.',
  visioTeacherNotOwner: "Vous n'êtes pas l'enseignant de cette séance : vous ne pouvez pas en rejoindre la visioconférence.",
  visioRoleRefused: 'Votre rôle ne permet pas de rejoindre cette visioconférence.',
  // tenant_not_resolved : le COMPTE n'a pas d'établissement ; se reconnecter n'y change rien.
  visioNoInstitution: "Votre compte n'est rattaché à aucun établissement : la visioconférence n'est pas accessible. Adressez-vous à votre administration.",
  // 404 de la porte « rejoindre » : le message générique (ressource introuvable)
  // n'aide pas l'élève ; c'est le CODE qui ne correspond à rien.
  codeInconnu: 'Ce code ne correspond à aucune classe. Vérifiez-le auprès de votre formateur.',
  codeVide: 'Saisissez le code que votre formateur vous a donné.',
  // D72-a : refus d'écriture d'une évaluation (POST, PUT, /publish). Chaque message dit le recours.
  evaluationTeacherIdentityMissing: "Votre compte n'est pas encore relié à votre fiche d'enseignant dans KLASSCI. Adressez-vous à votre établissement.",
  evaluationTeacherNotAssigned: "Vous n'êtes pas désigné pour enseigner cette matière dans cette classe.",
  evaluationSchedulingRequired: 'Cette évaluation doit d’abord être programmée dans KLASSCI.',
  evaluationIdentifierOutOfScope: 'Cette classe ou cette matière ne relève pas de votre établissement. Rechargez la page.',
  evaluationPublishViaDedicatedRoute: 'Une évaluation se publie par l’action « Publier », pas par sa modification.',
  evaluationWithoutQuestions: 'Une évaluation publiée doit compter au moins une question.',
  // S-matière : refus de création d'une séance locale (POST /lms/seances). Le couple vient du
  // catalogue de l'établissement : un refus dit qu'il a changé depuis le chargement de l'écran.
  seanceClasseHorsEtablissement: "Cette classe n'est plus disponible dans votre établissement. Choisissez-en une autre.",
  seanceMatiereHorsEtablissement: "Cette matière n'est plus disponible dans votre établissement. Choisissez-en une autre.",
  seanceMatiereHorsProgramme: "Cette matière n'est pas au programme de la classe choisie.",
  // B7 (D442) : des options d'avant lms_backend #1059 sans texte fidèle (objet, liste) ; texte du front.
  optionsIllisibles: "Les options de cette question n'ont pas pu être relues. Saisissez-les de nouveau avant d'enregistrer.",
  // B5 (D461) : les bornes des options d'une question (lms_backend #1069) ; textes du front.
  optionsMaxAtteint: 'Une question compte au plus 26 options.',
  optionsHorsBornes: "Cette question dépasse les bornes : 26 options au plus, de 1 000 caractères chacune. Retirez ou raccourcissez des options avant d'enregistrer.",
  // D466 (D467) : une bonne réponse absente des options, chargée telle, ou refusée par le back (422
  // `correct_answer_not_among_options`). Texte du front.
  bonneReponseOrpheline: "La bonne réponse d'une question ne correspond à aucune de ses options. Choisissez-la de nouveau.",
  unknown: 'Une erreur inattendue est survenue. Veuillez réessayer.',
})
