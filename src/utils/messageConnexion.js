import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { displayMessage } from '@/services/displayMessage'

/**
 * Le message d'un échec de CONNEXION (D477). Le back n'y pose aucun `reason` (AuthResponsePresenter) :
 * le statut porte le sens. Au login, un 401 veut dire « identifiants incorrects » — et non la catégorie
 * « session » du catalogue ; un 409, une adresse e-mail déjà prise par un autre compte de l'établissement
 * (KlassciEmailConflictGuard). Tout autre échec (422, 429, 500, 503, réseau, délai) dit sa catégorie.
 * Jamais le texte du serveur (D0), sauf UNE exception voulue :
 *
 * #711 (lms_backend#1739) : un 403 `klassci_account_refused` porte le motif de KLASSCI (« Vous n'êtes pas
 * encore réinscrit… »), écrit pour l'élève et nettoyé par le serveur. C'est le seul texte qui lui dise quoi
 * faire : il est montré tel quel, en texte (interpolation Vue), jamais en HTML. Vide, le catalogue.
 * @param {unknown} err
 * @returns {string}
 */
export function messageConnexion(err) {
  const status = err?.response?.status
  if (status === 401) return ERROR_MESSAGES.identifiantsIncorrects
  if (status === 409) return ERROR_MESSAGES.compteEnConflit
  const corps = err?.response?.data
  if (status === 403 && corps?.reason === 'klassci_account_refused') {
    const motif = typeof corps.message === 'string' ? corps.message.trim() : ''
    return motif !== '' ? motif : ERROR_MESSAGES.compteRefuseParKlassci
  }
  return displayMessage(err, ERROR_MESSAGES.connexionEchouee)
}
