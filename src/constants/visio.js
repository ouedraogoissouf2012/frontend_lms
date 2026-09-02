/**
 * Constantes & helpers visioconférence (#24) — domaine Jitsi configurable + temps.
 *
 * Le domaine Jitsi vient de `VITE_JITSI_DOMAIN` (défaut `meet.jit.si`), lu à
 * l'exécution via optional chaining (chargeable hors Vite, pattern roles.js).
 * Configurable par déploiement / institution, plus de hardcode dispersé.
 */

export const VISIO_CONFIG = Object.freeze({
  HEARTBEAT_INTERVAL_MS: 30000, // ping d'activité participant
  RECORDING_POLL_INTERVAL_MS: 5000, // rafraîchissement du statut d'enregistrement
  RECORDING_PROVIDER_ENABLED: false, // fail-closed tant que Jibri/JaaS/provider n'est pas validé
  PARTICIPATION_EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 jours
  DEFAULT_JITSI_DOMAIN: 'meet.jit.si',
})

export const VISIO_ROOM_REQUIRED_MESSAGE = 'Identifiant de salle visio introuvable dans la réponse API.'
export const VISIO_RECORDING_UNAVAILABLE_MESSAGE =
  "L'enregistrement n'est pas activé sur cette plateforme : aucun moteur Jitsi/Jibri n'est configuré."
export const VISIO_TOKEN_REQUIRED_MESSAGE =
  "Accès à la salle impossible : le serveur n'a pas délivré de jeton d'accès. Prévenez votre administrateur."

export const HEARTBEAT_INTERVAL_MS = VISIO_CONFIG.HEARTBEAT_INTERVAL_MS
export const RECORDING_POLL_INTERVAL_MS = VISIO_CONFIG.RECORDING_POLL_INTERVAL_MS
export const PARTICIPATION_EXPIRATION_MS = VISIO_CONFIG.PARTICIPATION_EXPIRATION_MS

/** Domaine Jitsi effectif (VITE_JITSI_DOMAIN ou défaut). */
export function getJitsiDomain() {
  const d = import.meta.env?.VITE_JITSI_DOMAIN
  return d && String(d).trim() ? String(d).trim() : VISIO_CONFIG.DEFAULT_JITSI_DOMAIN
}

/** URL du script IFrame API Jitsi. */
export function jitsiExternalApiSrc() {
  return `https://${getJitsiDomain()}/external_api.js`
}

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
  if (!roomId) throw new Error(message)
  return roomId
}

/**
 * Construit une URL de salle Jitsi.
 *
 * ## Le jeton d'accès (#469)
 *
 * Le serveur auto-hébergé tourne avec `ENABLE_AUTH=1` et `ENABLE_GUESTS=0` :
 * sans `?jwt=`, aucune salle ne s'ouvre. Le backend émet ce jeton sur
 * `POST /seances/{id}/join` depuis #668 — il porte la salle, l'identité et le
 * statut de modérateur, tous décidés côté serveur.
 *
 * L'option est **additive** : sans jeton, l'URL produite est strictement celle
 * d'avant. C'est ce qui permet de la déployer sans rien casser sur un serveur
 * qui n'exige pas d'authentification.
 *
 * ⚠️ Le jeton part en clair dans l'URL — historique du navigateur, journaux
 * d'accès du serveur Jitsi. C'est le prix de l'ouverture en onglet séparé : un
 * en-tête d'autorisation supposerait d'embarquer Jitsi en iframe. Le jeton est
 * borné à UNE salle et expire (2 h par défaut), ce qui rend ce compromis
 * acceptable ; il ne le serait pas pour un jeton de session.
 *
 * @param {string} roomId
 * @param {{ displayName?: string, prejoinDisabled?: boolean, token?: string|null }} [options]
 * @returns {string} `https://{domaine}/{roomId}[?jwt=…][#config…]`
 */
export function buildJitsiUrl(roomId, options = {}) {
  const safeRoomId = requireVisioRoomId(roomId)
  const { displayName, prejoinDisabled, token } = options

  // La query precede TOUJOURS le fragment : `?jwt=…#config…`. L'ordre inverse
  // ferait lire le jeton comme un morceau du fragment, donc l'ignorerait.
  const trimmedToken = typeof token === 'string' ? token.trim() : ''
  const query = trimmedToken ? `?jwt=${encodeURIComponent(trimmedToken)}` : ''
  const base = `https://${getJitsiDomain()}/${safeRoomId}${query}`

  if (!prejoinDisabled && displayName == null) return base
  const parts = []
  if (prejoinDisabled) parts.push('config.prejoinConfig.enabled=false')
  if (displayName != null) parts.push(`userInfo.displayName=${encodeURIComponent(displayName)}`)
  return `${base}#${parts.join('&')}`
}

/**
 * Construit l'URL de salle à partir de la réponse de `POST /seances/{id}/join`.
 *
 * ## Pourquoi la salle ET le jeton sortent de la MÊME réponse
 *
 * Le jeton n'existe qu'après cet appel. Construire l'URL avant — ce que faisait
 * le code jusqu'ici — condamnait le front à l'ignorer, quoi qu'émette le
 * backend. Lire les deux au même endroit rend l'inversion impossible à refaire.
 *
 * ## Pourquoi un jeton manquant fait ÉCHOUER
 *
 * Le serveur tourne avec `ENABLE_GUESTS=0` : sans jeton, la salle refusera
 * l'entrée. Ouvrir quand même produirait un onglet affichant une erreur
 * d'authentification que l'enseignant ne peut pas interpréter, en plein cours.
 *
 * Échouer ici, au clic, donne un message actionnable — et rend une
 * configuration serveur incomplète visible immédiatement plutôt que sous la
 * forme d'un « ça ne marche pas » remonté trois jours plus tard.
 *
 * @param {{data?: object}} response réponse déballée de l'API (`{success, message, data}`)
 * @param {{ displayName?: string, prejoinDisabled?: boolean }} [options]
 * @returns {string}
 * @throws {Error} salle absente, ou jeton indisponible
 */
export function buildJoinUrlFromResponse(response, options = {}) {
  const roomId = requireVisioRoomId(response)
  const token = response?.data?.visio_token

  // Le drapeau ET la valeur doivent tenir : un `available: true` accompagne
  // d'un jeton vide est une incoherence serveur, pas un cas degrade a absorber.
  const usable = typeof token === 'string' && token.trim() !== ''
  if (!usable) throw new Error(VISIO_TOKEN_REQUIRED_MESSAGE)

  return buildJitsiUrl(roomId, { ...options, token })
}
