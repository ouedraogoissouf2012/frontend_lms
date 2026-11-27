import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { displayMessage } from '@/services/displayMessage'

/** #1739 : le seul motif de connexion dont l'écran dit le texte du serveur. */
const REFUS_DE_L_ECOLE = 'klassci_account_refused'
/** La borne du serveur (KlassciCompteRefuseException::LONGUEUR_MAX) : au-delà, la réponse n'est pas la sienne. */
const LONGUEUR_MAX = 300

/**
 * Le message de l'école qui refuse CE compte (#1739), ou `null` si l'échec n'est pas ce refus.
 * Le serveur l'a nettoyé (texte seul, 300 caractères au plus) ; l'écran le rend en texte (`{{ }}`).
 * Illisible ou démesuré : le texte du front.
 * @param {unknown} err
 * @returns {string|null}
 */
function refusDeLEcole(err) {
  if (err?.response?.status !== 403 || err.response.data?.reason !== REFUS_DE_L_ECOLE) return null
  const texte = err.response.data.message
  const propre = typeof texte === 'string' ? texte.trim() : ''
  return propre !== '' && propre.length <= LONGUEUR_MAX ? propre : ERROR_MESSAGES.compteRefuseParEcole
}

/**
 * Le message d'un échec de CONNEXION (D477). Le statut porte le sens : au login, un 401 veut dire
 * « identifiants incorrects » — et non la catégorie « session » du catalogue ; un 409, une adresse
 * e-mail déjà prise par un autre compte de l'établissement (KlassciEmailConflictGuard). Un 403
 * `klassci_account_refused` dit le message de l'école (#1739, l'exception nommée de la garde D0).
 * Tout autre échec (403, 422, 429, 500, 503, réseau, délai) dit sa catégorie, jamais le texte du serveur.
 * @param {unknown} err
 * @returns {string}
 */
export function messageConnexion(err) {
  const status = err?.response?.status
  if (status === 401) return ERROR_MESSAGES.identifiantsIncorrects
  if (status === 409) return ERROR_MESSAGES.compteEnConflit
  return refusDeLEcole(err) ?? displayMessage(err, ERROR_MESSAGES.connexionEchouee)
}
