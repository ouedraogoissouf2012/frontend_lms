import { userError } from '@/utils/userError'
/**
 * Constantes & helpers visioconférence (#24) — domaine Jitsi et profil réseau.
 *
 * Le domaine vient de `VITE_JITSI_DOMAIN`, lu à l'exécution via optional
 * chaining (chargeable hors Vite, pattern roles.js). Il n'a **aucun défaut** :
 * voir `getJitsiDomain`.
 */

export const VISIO_CONFIG = Object.freeze({
  HEARTBEAT_INTERVAL_MS: 30000, // ping d'activité participant
  RECORDING_POLL_INTERVAL_MS: 5000, // rafraîchissement du statut d'enregistrement
  RECORDING_PROVIDER_ENABLED: false, // fail-closed tant que Jibri/JaaS/provider n'est pas validé
  PARTICIPATION_EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 jours

  // #673 — Délai de garde avant de conclure qu'un ordre d'enregistrement n'a
  // pas été confirmé. Ce n'est PAS le délai nominal : le fournisseur signale
  // ses échecs explicitement, bien plus vite. C'est un filet.
  //
  // Sa valeur vient de deux mesures, pas d'une intuition :
  //   · Jibri a mis 8,3 s puis 23,9 s à passer à `on` (journaux Jicofo, 2026-08-31) ;
  //   · Jicofo patiente lui-même `pending-timeout = "90 seconds"`
  //     (/run/jicofo/config/jicofo.conf:104).
  // Conclure à l'échec avant Jicofo ferait enregistrer Jibri sans que le LMS
  // ait rien persisté : le webhook de fin serait alors rejeté et le média
  // orphelin. D'où une marge au-dessus des 90 s.
  RECORDING_CONFIRMATION_TIMEOUT_MS: 120000,
})

export const VISIO_ROOM_REQUIRED_MESSAGE = 'Identifiant de salle visio introuvable dans la réponse API.'
export const VISIO_RECORDING_UNAVAILABLE_MESSAGE =
  "L'enregistrement n'est pas activé sur cette plateforme : aucun moteur Jitsi/Jibri n'est configuré."
export const VISIO_TOKEN_REQUIRED_MESSAGE =
  "Accès à la salle impossible : le serveur n'a pas délivré de jeton d'accès. Prévenez votre administrateur."
export const VISIO_DOMAIN_REQUIRED_MESSAGE =
  "Aucun serveur visio n'est configuré (VITE_JITSI_DOMAIN). Prévenez votre administrateur."

export const HEARTBEAT_INTERVAL_MS = VISIO_CONFIG.HEARTBEAT_INTERVAL_MS
export const RECORDING_POLL_INTERVAL_MS = VISIO_CONFIG.RECORDING_POLL_INTERVAL_MS
export const PARTICIPATION_EXPIRATION_MS = VISIO_CONFIG.PARTICIPATION_EXPIRATION_MS
export const RECORDING_CONFIRMATION_TIMEOUT_MS = VISIO_CONFIG.RECORDING_CONFIRMATION_TIMEOUT_MS

/**
 * Domaine Jitsi effectif. **Sans défaut, et c'est délibéré (#327).**
 *
 * Ce fichier retenait `meet.jit.si` quand `VITE_JITSI_DOMAIN` manquait au build.
 * Dans une chaîne par ailleurs fail-closed — `RECORDING_PROVIDER_ENABLED: false`
 * quelques lignes plus haut — c'était la seule porte fail-open : une variable
 * d'environnement oubliée envoyait la classe entière chez un opérateur public
 * avec lequel personne n'a de contrat, sur un produit qui filme des apprenants.
 * Aucune promesse de résidence des données ne tient dans ce cas.
 *
 * Le raisonnement est celui que `buildRoomConfigFromResponse` applique déjà au
 * jeton, plus bas dans ce fichier : échouer au clic donne un message actionnable
 * et rend une configuration incomplète visible tout de suite, au lieu d'un
 * « ça ne marche pas » remonté trois jours plus tard — ou, ici, d'un cours tenu
 * ailleurs que là où on le croit.
 *
 * Vouloir `meet.jit.si` reste possible : il faut l'écrire. C'est une décision,
 * plus un défaut.
 *
 * @throws {Error} si `VITE_JITSI_DOMAIN` est absent ou vide
 */
export function getJitsiDomain() {
  const d = import.meta.env?.VITE_JITSI_DOMAIN
  const domain = d ? String(d).trim() : ''
  if (!domain) throw userError(VISIO_DOMAIN_REQUIRED_MESSAGE)
  return domain
}

/** URL du script IFrame API Jitsi. */
export function jitsiExternalApiSrc() {
  return `https://${getJitsiDomain()}/external_api.js`
}

// Le profil réseau (débit, nombre de flux reçus, résolution) vit dans
// `visioNetwork.js` : ce fichier décrit QUELLE salle ouvrir, celui-là COMBIEN
// elle coûte à l'apprenant. Deux préoccupations, deux rythmes d'évolution.

function toBooleanOrNull(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false
  }
  return null
}

function envFlag(name, fallback = false) {
  return toBooleanOrNull(import.meta.env?.[name]) ?? fallback
}

function firstBoolean(...values) {
  for (const value of values) {
    const parsed = toBooleanOrNull(value)
    if (parsed !== null) return parsed
  }
  return null
}

/**
 * Capacité d'enregistrement réelle (#204), désactivée par défaut.
 * Le front doit rester fail-closed tant que le provider Jitsi/Jibri n'est pas
 * configuré. Un signal backend explicite à false garde la priorité.
 */
export function isVisioRecordingProviderEnabled(visio = null) {
  const clientEnabled = envFlag('VITE_VISIO_RECORDING_ENABLED', VISIO_CONFIG.RECORDING_PROVIDER_ENABLED)
  if (!clientEnabled) return false

  const backendEnabled = firstBoolean(
    visio?.recording_provider_enabled,
    visio?.recording_enabled,
    visio?.capabilities?.recording,
    visio?.recording_capability?.enabled,
    visio?.recording?.provider_enabled,
    visio?.recording?.capability?.enabled,
  )
  return backendEnabled !== false
}

export function getVisioRoomId(source) {
  if (source === null || source === undefined) return null
  if (typeof source !== 'object') {
    const roomId = String(source).trim()
    return roomId || null
  }

  const candidates = [
    source.visio_room_id,
    source.room_id,
    source.room_name,
    source.visio?.visio_room_id,
    source.visio?.room_id,
    source.visio?.room_name,
    source.data?.visio_room_id,
    source.data?.room_id,
    source.data?.room_name,
    source.data?.visio?.visio_room_id,
    source.data?.visio?.room_id,
    source.data?.visio?.room_name
  ]

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue
    const roomId = String(candidate).trim()
    if (roomId) return roomId
  }

  return null
}

export function requireVisioRoomId(source, message = VISIO_ROOM_REQUIRED_MESSAGE) {
  const roomId = getVisioRoomId(source)
  if (!roomId) throw userError(message)
  return roomId
}

/**
 * Décrit la salle à ouvrir à partir de la réponse de `POST /seances/{id}/join`.
 *
 * ## Pourquoi une configuration plutôt qu'une URL (#673)
 *
 * La salle n'est plus ouverte dans un onglet mais embarquée : le jeton devient
 * une option passée à l'IFrame API, et non un `?jwt=` visible dans la barre
 * d'adresse, l'historique du navigateur et les journaux d'accès du serveur
 * Jitsi. C'est la disparition d'un compromis qui était assumé faute de mieux.
 *
 * Le constructeur d'URL de l'onglet séparé a été retiré (#612) :
 * sans appelant depuis #673, il gardait un piège. Hors iframe, la surcharge
 * `config.prejoinConfig.enabled=false` de son fragment fait entrer Jitsi sans
 * micro ni caméra (`disableInitialGUM`). Le pré-join se coupe par
 * `configOverwrite` (`jitsiConfigOverwrite`), jamais par l'URL.
 *
 * Les deux valeurs sortent de la MÊME réponse, pour la même raison qu'avant :
 * le jeton n'existe qu'après cet appel. Les lire ailleurs condamnerait le front
 * à l'ignorer, quoi qu'émette le backend.
 *
 * Un jeton manquant fait ÉCHOUER, il n'est jamais absorbé : le serveur tourne
 * avec `ENABLE_GUESTS=0`, la salle refuserait l'entrée. Échouer ici donne un
 * message actionnable au lieu d'une erreur d'authentification illisible en
 * plein cours.
 *
 * @param {{data?: object}} response réponse déballée de l'API (`{success, message, data}`)
 * @param {{ displayName?: string }} [options]
 * @returns {{ domain: string, roomName: string, jwt: string, displayName: string|null }}
 * @throws {Error} salle absente, ou jeton indisponible
 */
export function buildRoomConfigFromResponse(response, options = {}) {
  const roomName = requireVisioRoomId(response)
  const token = response?.data?.visio_token

  // Le drapeau ET la valeur doivent tenir : un `available: true` accompagné
  // d'un jeton vide est une incohérence serveur, pas un cas dégradé à absorber.
  const usable = typeof token === 'string' && token.trim() !== ''
  if (!usable) throw userError(VISIO_TOKEN_REQUIRED_MESSAGE)

  return {
    domain: getJitsiDomain(),
    roomName,
    jwt: token.trim(),
    displayName: options.displayName ?? null,
    // Ferme par defaut (#673) : un front plus recent que son backend, ou une
    // reponse tronquee, doit degrader vers « pas le droit ». L'inverse
    // afficherait un bouton que la salle refusera - la divergence meme que
    // cette issue ferme. `=== true` refuse aussi les valeurs vaguement vraies.
    canManageRecording: response?.data?.can_manage_recording === true,
  }
}
