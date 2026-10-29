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
  enrolmentNotActive: "Ce code n'est plus actif. Demandez-en un nouveau à votre formateur.",
  noInstitution: "Votre compte n'est rattaché à aucun établissement. Contactez votre administrateur.",
  accountQuotaExceeded: "Trop d'essais en peu de temps. Réessayez dans une minute.",
  accountDailyCapReached: "Vous avez atteint la limite d'essais pour aujourd'hui. Réessayez demain.",
  institutionCapReached: "Votre établissement a atteint sa limite d'inscriptions pour aujourd'hui. Réessayez demain.",
  // 404 de la porte « rejoindre » : le message générique (ressource introuvable)
  // n'aide pas l'élève ; c'est le CODE qui ne correspond à rien.
  codeInconnu: 'Ce code ne correspond à aucune classe. Vérifiez-le auprès de votre formateur.',
  unknown: 'Une erreur inattendue est survenue. Veuillez réessayer.',
})
