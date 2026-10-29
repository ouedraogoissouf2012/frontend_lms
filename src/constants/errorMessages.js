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
  klassciUnavailable: 'Service KLASSCI temporairement indisponible. Veuillez réessayer dans quelques instants.',
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
  visioTeacherNotOwner: "Vous n'êtes pas l'enseignant de cette séance : vous ne pouvez pas en rejoindre la visioconférence.",
  visioRoleRefused: 'Votre rôle ne permet pas de rejoindre cette visioconférence.',
  // tenant_not_resolved : le COMPTE n'a pas d'établissement ; se reconnecter n'y change rien.
  visioNoInstitution: "Votre compte n'est rattaché à aucun établissement : la visioconférence n'est pas accessible. Adressez-vous à votre administration.",
  // 404 de la porte « rejoindre » : le message générique (ressource introuvable)
  // n'aide pas l'élève ; c'est le CODE qui ne correspond à rien.
  codeInconnu: 'Ce code ne correspond à aucune classe. Vérifiez-le auprès de votre formateur.',
  codeVide: 'Saisissez le code que votre formateur vous a donné.',
  unknown: 'Une erreur inattendue est survenue. Veuillez réessayer.',
})
