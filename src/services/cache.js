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
 * #224 (SWR) — Lit une entrée SANS l'exigence de fraîcheur : renvoie la donnée
 * même PÉRIMÉE (sans la purger), avec un drapeau `fresh` (dans le TTL ou non).
 * Permet le stale-while-revalidate : servir immédiatement le cache (même vieux)
 * puis revalider en arrière-plan. Une entrée corrompue est purgée → { null, false }.
 * @param {string} name
 * @returns {{ data: any, fresh: boolean }} `data` vaut null si absent/corrompu.
 */
export function readCacheStale(name) {
  const key = cacheKey(name)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { data: null, fresh: false }
    const { data, timestamp } = JSON.parse(raw)
    return { data, fresh: Date.now() - timestamp <= CACHE_TTL }
  } catch {
    localStorage.removeItem(key)
    return { data: null, fresh: false }
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
 * #315 — Purge TOUTES les entrées de l'utilisateur/institution courant dont le
 * nom logique commence par `namePrefix`.
 *
 * Nécessaire quand une ressource scope sa clé par un paramètre (clé dynamique de
 * `useCachedResource`, ex. `seances_management_d7`/`_d30`) : une purge par clé
 * FIXE (`clearCache('seances_management')`) ne toucherait plus aucune variante.
 * Scopée au user/institution comme {@link cacheKey} (le suffixe `_cache_<inst>_u<id>`
 * borne la purge) — ne vide jamais le cache d'un autre utilisateur.
 */
export function clearCacheByPrefix(namePrefix) {
  const institution = auth.getInstitution() || 'default'
  const userId = auth.getUser()?.id ?? 'anon'
  const suffix = `_cache_${institution}_u${userId}`
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(namePrefix) && key.endsWith(suffix)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

/**
 * #237 — Clés de cache par entité KLASSCI (lecture seule côté LMS).
 *
 * La MÊME donnée (classes/matières/enseignants) est mise en cache sous plusieurs
 * clés par des composables différents, à TTL indépendants. Un « rafraîchir »
 * depuis une vue ne vidait que SA clé → les autres vues servaient l'ancienne
 * version jusqu'au TTL. `admin_users` regroupe classes + enseignants (+ étudiants).
 */
const ENTITY_CACHE_KEYS = Object.freeze({
  classes: ['admin_classes_v3', 'admin_klassci_classes', 'admin_users', 'teacher_classes'],
  matieres: ['admin_matieres', 'admin_klassci_matieres', 'teacher_matieres'],
  enseignants: ['admin_enseignants', 'admin_users'],
})

/**
 * Invalide TOUTES les clés de cache liées à une entité (#237), pour que le
 * rafraîchissement d'une vue rende les autres vues cohérentes. Sans effet si
 * l'entité est inconnue.
 * @param {'classes'|'matieres'|'enseignants'} entity
 */
export function invalidateEntity(entity) {
  const keys = ENTITY_CACHE_KEYS[entity]
  if (!Array.isArray(keys)) return
  keys.forEach((name) => clearCache(name))
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
