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
  validation: 'Certaines informations sont invalides. Veuillez vérifier votre saisie.',
  rateLimit: 'Trop de requêtes en peu de temps. Veuillez patienter quelques instants.',
  server: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
  network: 'Connexion impossible. Vérifiez votre connexion internet et réessayez.',
  unknown: 'Une erreur inattendue est survenue. Veuillez réessayer.',
})
