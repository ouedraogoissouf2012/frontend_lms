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
  PARTICIPATION_EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 jours
  DEFAULT_JITSI_DOMAIN: 'meet.jit.si',
})

export const VISIO_ROOM_REQUIRED_MESSAGE = 'Identifiant de salle visio introuvable dans la réponse API.'

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
 * @param {string} roomId
 * @param {{ displayName?: string, prejoinDisabled?: boolean }} [options]
 * @returns {string} `https://{domaine}/{roomId}` ou avec fragment hash de config.
 */
export function buildJitsiUrl(roomId, options = {}) {
  const safeRoomId = requireVisioRoomId(roomId)
  const base = `https://${getJitsiDomain()}/${safeRoomId}`
  const { displayName, prejoinDisabled } = options
  if (!prejoinDisabled && displayName == null) return base
  const parts = []
  if (prejoinDisabled) parts.push('config.prejoinConfig.enabled=false')
  if (displayName != null) parts.push(`userInfo.displayName=${encodeURIComponent(displayName)}`)
  return `${base}#${parts.join('&')}`
}
