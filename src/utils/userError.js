/**
 * Une erreur dont le texte est RÉDIGÉ PAR LE FRONT pour l'utilisateur.
 *
 * Le texte est porté par `userMessage`, le seul champ qu'un toast affiche tel quel
 * (`visioFeedback.messageFrom`, l'intercepteur d'`api.js` pour les erreurs HTTP). Un
 * `error.message` ordinaire n'est jamais affiché : il peut porter le texte du serveur ou
 * une clé de fournisseur (`service_unavailable`), D0.
 *
 * `definitif` : un REFUS que réessayer ne lèvera pas (réponse 2xx « success: false »). Sans lui,
 * l'erreur n'a pas de `response` et `estPannePassagere` la prend pour une panne réseau.
 *
 * @param {string} message texte du front, en français, destiné à l'utilisateur
 * @param {{ definitif?: boolean }} [options]
 * @returns {Error & { userMessage: string, definitif?: true }}
 */
export function userError(message, { definitif = false } = {}) {
  const erreur = new Error(message)
  erreur.userMessage = message
  if (definitif) erreur.definitif = true
  return erreur
}
