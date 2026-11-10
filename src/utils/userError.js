/**
 * Une erreur dont le texte est RÉDIGÉ PAR LE FRONT pour l'utilisateur.
 *
 * Le texte est porté par `userMessage`, le seul champ qu'un toast affiche tel quel
 * (`visioFeedback.messageFrom`, l'intercepteur d'`api.js` pour les erreurs HTTP). Un
 * `error.message` ordinaire n'est jamais affiché : il peut porter le texte du serveur ou
 * une clé de fournisseur (`service_unavailable`), D0.
 *
 * @param {string} message texte du front, en français, destiné à l'utilisateur
 * @returns {Error & { userMessage: string }}
 */
export function userError(message) {
  const erreur = new Error(message)
  erreur.userMessage = message
  return erreur
}
