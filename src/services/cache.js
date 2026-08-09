import { auth } from './api'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Returns a cache key scoped par institution ET par utilisateur (#230).
 *
 * Le scope par institution seul ne suffit pas : sur un poste partagé (labo
 * scolaire), l'utilisateur A ferme l'onglet sans se déconnecter (sessionStorage
 * vidé, mais le cache localStorage persiste), puis B (même école) se connecte et
 * lisait le cache encore valide de A. En incluant l'id utilisateur dans la clé,
 * B ne peut plus lire le cache de A. `anon` avant authentification.
 */
export function cacheKey(name) {
  const institution = auth.getInstitution() || 'default'
  const userId = auth.getUser()?.id ?? 'anon'
  return `${name}_cache_${institution}_u${userId}`
}

/**
 * Read a cache entry. Returns null if missing or expired.
 */
export function readCache(name) {
  const key = cacheKey(name)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

/**
 * Write a cache entry with the current timestamp.
 */
export function writeCache(name, data) {
  const key = cacheKey(name)
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // localStorage full — ignore
  }
}

/**
 * Remove a single cache entry.
 */
export function clearCache(name) {
  localStorage.removeItem(cacheKey(name))
}

/**
 * Clear ALL LMS cache entries (used on logout).
 * Matches any key containing '_cache_'.
 */
export function clearAllCache() {
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes('_cache_')) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}
