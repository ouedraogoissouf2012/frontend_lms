import { auth } from './api'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Returns a tenant-scoped localStorage cache key.
 * Uses the institution slug from session so each school gets its own key.
 */
export function cacheKey(name) {
  const institution = auth.getInstitution() || 'default'
  return `${name}_cache_${institution}`
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
