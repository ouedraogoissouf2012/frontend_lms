/**
 * Configuration HTTP centralisée (#24) — base d'API depuis `VITE_API_URL`.
 *
 * Sécurité : pas de fallback localhost SILENCIEUX en production. Si `VITE_API_URL`
 * est absent en prod, on échoue explicitement (un build prod doit fournir l'URL) ;
 * le défaut localhost est confiné au mode développement.
 */

const DEV_API_URL = '/api'

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
