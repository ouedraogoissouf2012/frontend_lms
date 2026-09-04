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
 * @param {string | (() => string)} name - Clé de cache logique (ex. 'admin_stats').
 *   #315 : accepte aussi une FONCTION, ré-évaluée à chaque `load()`/`revalidate()`,
 *   pour scoper l'entrée par un paramètre de requête (ex.
 *   `() => \`admin_seances_d\${filters.days}\``). Sans ça, deux valeurs de paramètre
 *   partageraient la même clé et se serviraient mutuellement des données périmées.
 * @param {() => Promise<T>} fetcher - Récupère la donnée fraîche ; rejette sur erreur.
 * @param {{ immediate?: boolean, onError?: (e: unknown) => void,
 *   cacheable?: () => boolean }} [options]
 *   - immediate (défaut true) : charge dès l'appel. false → appeler `load()` soi-même.
 *   - onError : rappel optionnel sur échec de revalidation (en plus de `error`).
 *   - cacheable (défaut `() => true`) : prédicat évalué à chaque chargement. Quand
 *     il renvoie faux, on NE lit NI n'écrit le cache et on charge à froid — pour les
 *     ressources dont l'entrée courante ne doit pas être mise en cache (ex.
 *     AdminSeances : liste filtrée par enseignant/classe, qui ne doit pas être
 *     servie aux vues non filtrées sous la même clé). #315.
 * @returns {{ data: import('vue').Ref<T|null>, loading: import('vue').Ref<boolean>,
 *   revalidating: import('vue').Ref<boolean>, error: import('vue').Ref<string|null>,
 *   load: () => Promise<void>, refresh: () => Promise<void> }}
 */
export function useCachedResource(name, fetcher, options = {}) {
  const data = ref(null)
  const loading = ref(false)
  const revalidating = ref(false)
  const error = ref(null)
  // #315 : mise en cache conditionnelle. Par défaut on met toujours en cache
  // (comportement historique, inchangé pour les consommateurs existants).
  const isCacheable = typeof options.cacheable === 'function' ? options.cacheable : () => true
  // #315 : clé dynamique optionnelle. Une `name` string garde le comportement
  // historique à l'identique ; une fonction est ré-évaluée à chaque accès.
  const resolveKey = typeof name === 'function' ? name : () => name

  async function revalidate() {
    revalidating.value = true
    // Fige la clé AVANT le fetch : l'écriture doit atterrir sous la clé qui
    // correspond à l'état (ex. `days`) au moment de la requête, même si cet état
    // change pendant que le réseau répond.
    const key = resolveKey()
    try {
      const fresh = await fetcher()
      data.value = fresh
      if (isCacheable()) writeCache(key, fresh)
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
    // Cache non applicable (ex. filtres actifs) → chargement froid direct, sans
    // lire une entrée qui ne correspondrait pas à la requête courante.
    const entry = isCacheable() ? readCacheStale(resolveKey()) : { data: null, fresh: false }
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
