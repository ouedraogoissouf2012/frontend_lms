import { ref } from 'vue'
import { readCacheStale, writeCache } from '@/services/cache'

/**
 * #224 — Ressource en cache avec stale-while-revalidate (SWR).
 *
 * Remplace le schéma binaire « lire-ou-bloquer » de la plupart des écrans :
 *  - avant : entrée fraîche → servie sans jamais rafraîchir (jusqu'à 5 min de
 *    données périmées, muettes) ; entrée expirée → l'utilisateur ATTEND le réseau.
 *  - désormais : on sert IMMÉDIATEMENT l'entrée en cache (même périmée), puis on
 *    revalide en ARRIÈRE-PLAN et on met à jour quand la réponse arrive.
 *
 * `loading` n'est vrai que lors d'un chargement FROID (aucune donnée à afficher) ;
 * une revalidation d'arrière-plan n'affiche pas de spinner bloquant (`revalidating`).
 * Sur échec de revalidation, la donnée déjà affichée est conservée et `error` est
 * renseigné (via `err.userMessage`, cf. intercepteur). Le cache est scopé par
 * utilisateur/institution (cache.js, #230).
 *
 * @template T
 * @param {string} name - Clé de cache logique (ex. 'admin_stats').
 * @param {() => Promise<T>} fetcher - Récupère la donnée fraîche ; rejette sur erreur.
 * @param {{ immediate?: boolean, onError?: (e: unknown) => void }} [options]
 *   - immediate (défaut true) : charge dès l'appel. false → appeler `load()` soi-même.
 *   - onError : rappel optionnel sur échec de revalidation (en plus de `error`).
 * @returns {{ data: import('vue').Ref<T|null>, loading: import('vue').Ref<boolean>,
 *   revalidating: import('vue').Ref<boolean>, error: import('vue').Ref<string|null>,
 *   load: () => Promise<void>, refresh: () => Promise<void> }}
 */
export function useCachedResource(name, fetcher, options = {}) {
  const data = ref(null)
  const loading = ref(false)
  const revalidating = ref(false)
  const error = ref(null)

  async function revalidate() {
    revalidating.value = true
    try {
      const fresh = await fetcher()
      data.value = fresh
      writeCache(name, fresh)
      error.value = null
    } catch (e) {
      // On CONSERVE la donnée déjà affichée (stale) et on signale l'erreur.
      error.value = e?.userMessage || 'Impossible de charger les données.'
      if (typeof options.onError === 'function') options.onError(e)
    } finally {
      revalidating.value = false
      loading.value = false
    }
  }

  async function load() {
    const entry = readCacheStale(name)
    if (entry.data !== null && entry.data !== undefined) {
      // On a quelque chose à montrer (même périmé) → affichage immédiat + revalidation
      // d'arrière-plan NON bloquante.
      data.value = entry.data
      loading.value = false
      revalidate()
    } else {
      // Rien en cache → chargement froid bloquant (spinner légitime).
      loading.value = true
      await revalidate()
    }
  }

  if (options.immediate !== false) {
    load()
  }

  return { data, loading, revalidating, error, load, refresh: revalidate }
}
