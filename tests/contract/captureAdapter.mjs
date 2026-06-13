/**
 * Adaptateur de capture pour les tests de contrat (#17 — api-contract-sync).
 *
 * Remplace l'adaptateur de l'instance axios partagée (`src/services/api.js`) par
 * un adaptateur qui CAPTURE la requête (méthode, chemin, params, corps) au lieu de
 * l'émettre sur le réseau. Permet d'asserter le contrat HTTP des services sans
 * appel réel ni dépendance de mock tierce (NF2).
 *
 * Fournit aussi `installEnv()` : des stubs en mémoire de `sessionStorage` /
 * `localStorage`, car l'intercepteur de requête d'`api.js` lit `sessionStorage`
 * (le token) et ces globals n'existent pas sous Node.
 *
 * @see .claude/specs/api-contract-sync/design.md §5
 */
import api from '../../src/services/api.js'

/** Crée un Storage minimal conforme à l'API Web Storage, backé par une Map. */
function makeStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)) },
    removeItem: (key) => { store.delete(key) },
    key: (index) => Array.from(store.keys())[index] ?? null,
    clear: () => store.clear(),
    get length() { return store.size },
  }
}

/**
 * Installe les globals de storage si absents (idempotent).
 * À appeler avant tout appel de service (l'intercepteur lit sessionStorage).
 */
export function installEnv() {
  if (typeof globalThis.sessionStorage === 'undefined') {
    globalThis.sessionStorage = makeStorage()
  }
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = makeStorage()
  }
}

/**
 * Installe l'adaptateur de capture sur l'instance axios partagée.
 * @returns {{ calls: Array, last: () => object|undefined, reset: () => void }}
 */
export function installCapture() {
  installEnv()
  const calls = []

  api.defaults.adapter = (config) =>
    new Promise((resolve) => {
      calls.push({
        method: String(config.method || '').toUpperCase(),
        // `config.url` est le chemin relatif passé au service (ex. `/quizzes/42/start`).
        // Le baseURL n'est pas combiné par cet adaptateur — on asserte le chemin canonique.
        url: config.url,
        params: config.params ?? null,
        // axios applique transformRequest AVANT l'adaptateur : `config.data` est déjà
        // une chaîne JSON quand un corps est présent.
        data: typeof config.data === 'string' && config.data.length
          ? safeParse(config.data)
          : (config.data ?? null),
      })
      // L'intercepteur de réponse d'api.js renvoie `response.data` : on simule une
      // enveloppe API standard pour que les services ne lèvent pas.
      resolve({
        data: { success: true, data: [], count: 0 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      })
    })

  return {
    calls,
    last: () => calls[calls.length - 1],
    reset: () => { calls.length = 0 },
  }
}

function safeParse(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}
