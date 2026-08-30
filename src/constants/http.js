/**
 * Configuration HTTP centralisée (#24) — base d'API depuis `VITE_API_URL`.
 *
 * Sécurité : pas de fallback localhost SILENCIEUX en production. Si `VITE_API_URL`
 * est absent en prod, on échoue explicitement (un build prod doit fournir l'URL) ;
 * le défaut localhost est confiné au mode développement.
 */

const DEV_API_URL = '/api'

/**
 * Délai maximal d'une requête API, en millisecondes.
 *
 * Axios n'impose AUCUN délai par défaut (`timeout: 0` = attente infinie) : sans
 * cette valeur, une requête que le serveur ne termine jamais laissait l'écran sur
 * son indicateur de chargement indéfiniment, sans erreur ni possibilité de
 * réessayer — l'utilisateur n'avait que le rechargement de page comme issue.
 *
 * 30 s est un plafond volontairement large : le backend proxifie KLASSCI avec son
 * propre budget (5 s d'appel amont + rejeu), et certaines agrégations admin sont
 * lentes. Il ne s'agit pas d'optimiser la latence mais de garantir une SORTIE.
 */
export const API_TIMEOUT_MS = 30000

/** Base de l'API (avec /api). Throw en prod si VITE_API_URL absent. */
export function apiBaseUrl() {
  const url = import.meta.env?.VITE_API_URL
  if (url) return url
  if (import.meta.env?.PROD) {
    throw new Error('VITE_API_URL est requis en production (aucun fallback localhost).')
  }
  return DEV_API_URL
}

/** Origine de l'API (sans le suffixe /api), pour les URL construites à la main (ex. Beacon). */
export function apiOrigin() {
  return apiBaseUrl().replace(/\/api\/?$/, '')
}
