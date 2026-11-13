import { ref, computed } from 'vue'
import { estPannePassagere } from '@/utils/pannePassagere'
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
  let echecEnrichi = null
  try {
    const response = await klassciService.getLmsEnseignants({ with_details: true })
    if (response?.success && hasArrayPayload(response.data, ['enseignants'])) {
      // Lecture honnête : l'origine est gardée (meta.source) pour DIRE ce que la source locale ne suit pas.
      return { enseignants: asObjectArray(response.data, ['enseignants']), sourceLocale: response.meta?.source === 'lms_local' }
    }
  } catch (error) {
    // Enrichi indisponible (503…) → repli ci-dessous ; son échec est gardé.
    echecEnrichi = error
  }
  try {
    const fallback = await klassciService.getEnseignants()
    return asObjectArray(fallback, ['enseignants'])
  } catch (error) {
    // Enrichi en PANNE et repli refusé : c'est la panne qu'on rend, un nouvel essai peut atteindre
    // l'enrichi (règle d'AdminStats : une seule panne suffit à proposer « Réessayer »).
    throw echecEnrichi && estPannePassagere(echecEnrichi) && !estPannePassagere(error) ? echecEnrichi : error
  }
}

/**
 * Couche données d'AdminEnseignants (#G1 ≤300). Le schéma cache + revalidation
 * d'arrière-plan est désormais centralisé par `useCachedResource` (#224) : plus
 * de duplication du « lire-le-cache-puis-rafraîchir » propre à cet écran.
 */
export function useAdminEnseignants() {
  const selectedEnseignant = ref(null)

  const { data, loading, error, canRetry, refresh } = useCachedResource('admin_enseignants', fetchEnseignants)

  // `data` peut être un tableau déjà normalisé (fetcher) ou une entrée de cache
  // corrompue : la normalisation défensive garde l'invariant « tableau d'objets ».
  const enseignants = computed(() => asObjectArray(data.value, ['enseignants']))
  // École créée depuis le LMS : heures, taux et séances ne sont pas suivis (cache ancien : faux).
  const sourceLocale = computed(() => data.value?.sourceLocale === true)

  const stats = computed(() => computeEnseignantsStats(enseignants.value))
  // Liste jamais chargée (ni réseau ni cache) : compteurs NON MESURÉS (`null`,
  // rendus « — »), jamais quatre 0 sous un refus. Un cache périmé reste une mesure.
  const mesure = computed(() => data.value != null)
  const nbEnseignants = computed(() => (mesure.value ? enseignants.value.length : null))
  const totalMatieres = computed(() => (mesure.value ? stats.value.totalMatieres : null))
  const totalClasses = computed(() => (mesure.value ? stats.value.totalClasses : null))
  const enseignantsActifs = computed(() => (mesure.value ? stats.value.actifs : null))

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
    enseignants, loading, error, canRetry, sourceLocale, selectedEnseignant,
    nbEnseignants, totalMatieres, totalClasses, enseignantsActifs,
    loadEnseignants, selectEnseignant, closeModal,
  }
}
