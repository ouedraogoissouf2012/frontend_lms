/**
 * Constantes & helpers visioconférence (#24) — domaine Jitsi configurable + temps.
 *
 * Le domaine Jitsi vient de `VITE_JITSI_DOMAIN` (défaut `meet.jit.si`), lu à
 * l'exécution via optional chaining (chargeable hors Vite, pattern roles.js).
 * Configurable par déploiement / institution, plus de hardcode dispersé.
 */

export const VISIO_CONFIG = Object.freeze({
  HEARTBEAT_INTERVAL_MS: 30000, // ping d'activité participant
  PARTICIPATION_EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 jours
  DEFAULT_JITSI_DOMAIN: 'meet.jit.si',
})

export const HEARTBEAT_INTERVAL_MS = VISIO_CONFIG.HEARTBEAT_INTERVAL_MS
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

/**
 * Construit une URL de salle Jitsi.
 * @param {string} roomId
 * @param {{ displayName?: string, prejoinDisabled?: boolean }} [options]
 * @returns {string} `https://{domaine}/{roomId}` ou avec fragment hash de config.
 */
export function buildJitsiUrl(roomId, options = {}) {
  const base = `https://${getJitsiDomain()}/${roomId}`
  const { displayName, prejoinDisabled } = options
  if (!prejoinDisabled && displayName == null) return base
  const parts = []
  if (prejoinDisabled) parts.push('config.prejoinConfig.enabled=false')
  if (displayName != null) parts.push(`userInfo.displayName=${encodeURIComponent(displayName)}`)
  return `${base}#${parts.join('&')}`
}
