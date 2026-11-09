import { normalizeError } from './errorHandler'

/**
 * Le message à AFFICHER pour une erreur : son SENS, jamais un texte venu d'ailleurs (D0).
 * - `userMessage` (posé par l'intercepteur à partir du `reason`, ou rédigé par le front via
 *   `userError`) ;
 * - une erreur HTTP sans `userMessage` : la catégorie de `normalizeError` (statut ou `reason`) ;
 * - toute autre erreur : le repli rédigé par l'appelant.
 * Ni `response.data.message` ni `error.message` ne sont affichés.
 *
 * Module à part : les tests qui simulent `errorHandler` (avec le seul `normalizeError`)
 * gardent un `displayMessage` réel.
 *
 * @param {*} error
 * @param {string} fallback - texte du front
 * @returns {string}
 */
export function displayMessage(error, fallback) {
  if (!error) return fallback
  if (error.userMessage) return error.userMessage
  if (error.response) return normalizeError(error).userMessage
  return error.message || fallback
}
