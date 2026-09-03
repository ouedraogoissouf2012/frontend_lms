import { ref, computed } from 'vue'
import klassciService from '@/services/klassci'
import { invalidateEntity } from '@/services/cache'
import { useCachedResource } from '@/composables/useCachedResource'
// #28 : logique métier pure extraite (testée dans tests/unit/enseignants.test.js)
import { computeEnseignantsStats } from '@/utils/enseignants'

const asArray = (value, keys = []) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key]
  }
  if (Array.isArray(value.data)) return value.data
  for (const key of keys) {
    if (Array.isArray(value.data?.[key])) return value.data[key]
  }

  return []
}

const hasArrayPayload = (value, keys = []) => {
  if (Array.isArray(value)) return true
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value.data)) return true
  return keys.some(key => Array.isArray(value[key]) || Array.isArray(value.data?.[key]))
}

const asObjectArray = (value, keys = []) =>
  asArray(value, keys).filter(item => item && typeof item === 'object')

/**
 * Récupère les enseignants KLASSCI : endpoint enrichi (matières/classes), avec
 * repli sur l'endpoint simple si l'enrichi échoue ou répond `success:false`.
 * Renvoie TOUJOURS un tableau d'objets normalisé. Rejette seulement si le repli
 * lui-même échoue — c'est alors `useCachedResource` qui conserve l'affichage en
 * cache et renseigne `error`.
 */
async function fetchEnseignants() {
  try {
    const response = await klassciService.getLmsEnseignants({ with_details: true })
    if (response?.success && hasArrayPayload(response.data, ['enseignants'])) {
      return asObjectArray(response.data, ['enseignants'])
    }
  } catch {
    // Enrichi indisponible (503…) → repli ci-dessous.
  }
  const fallback = await klassciService.getEnseignants()
  return asObjectArray(fallback, ['enseignants'])
}

/**
 * Couche données d'AdminEnseignants (#G1 ≤300). Le schéma cache + revalidation
 * d'arrière-plan est désormais centralisé par `useCachedResource` (#224) : plus
 * de duplication du « lire-le-cache-puis-rafraîchir » propre à cet écran.
 */
export function useAdminEnseignants() {
  const selectedEnseignant = ref(null)

  const { data, loading, error, refresh } = useCachedResource('admin_enseignants', fetchEnseignants)

  // `data` peut être un tableau déjà normalisé (fetcher) ou une entrée de cache
  // corrompue : la normalisation défensive garde l'invariant « tableau d'objets ».
  const enseignants = computed(() => asObjectArray(data.value, ['enseignants']))

  const stats = computed(() => computeEnseignantsStats(enseignants.value))
  const totalMatieres = computed(() => stats.value.totalMatieres)
  const totalClasses = computed(() => stats.value.totalClasses)
  const enseignantsActifs = computed(() => stats.value.actifs)

  /**
   * Rechargement. `forceReload` invalide TOUTES les clés « enseignants »
   * (#237 : admin_enseignants + admin_users groupé) pour que les autres vues ne
   * servent plus une version périmée, puis revalide.
   */
  function loadEnseignants(forceReload = false) {
    if (forceReload) invalidateEntity('enseignants')
    return refresh()
  }

  function selectEnseignant(enseignant) {
    selectedEnseignant.value = enseignant
  }

  function closeModal() {
    selectedEnseignant.value = null
  }

  return {
    enseignants, loading, error, selectedEnseignant,
    totalMatieres, totalClasses, enseignantsActifs,
    loadEnseignants, selectEnseignant, closeModal,
  }
}
