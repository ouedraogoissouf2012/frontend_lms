import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { displayMessage } from '@/services/displayMessage'

/**
 * Le message d'un échec de CONNEXION (D477). Le back n'y pose aucun `reason` (AuthResponsePresenter) :
 * le statut porte le sens. Au login, un 401 veut dire « identifiants incorrects » — et non la catégorie
 * « session » du catalogue ; un 409, une adresse e-mail déjà prise par un autre compte de l'établissement
 * (KlassciEmailConflictGuard). Tout autre échec (422, 429, 500, 503, réseau, délai) dit sa catégorie.
 * Jamais le texte du serveur (D0).
 * @param {unknown} err
 * @returns {string}
 */
export function messageConnexion(err) {
  const status = err?.response?.status
  if (status === 401) return ERROR_MESSAGES.identifiantsIncorrects
  if (status === 409) return ERROR_MESSAGES.compteEnConflit
  return displayMessage(err, ERROR_MESSAGES.connexionEchouee)
}
