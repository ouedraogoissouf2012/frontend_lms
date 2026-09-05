import { ref, reactive, computed } from 'vue'
import lmsService from '@/services/lms'
import { klassciService } from '@/services/klassci'
import { extractList } from '@/utils/apiList'
import { useCachedResource } from '@/composables/useCachedResource'

/**
 * Composable de données des séances côté coordinateur (G7).
 *
 * Encapsule l'état réactif (séances, classes, enseignants, filtres) et les
 * appels API de chargement (LMS + KLASSCI). Extrait du god-component
 * `SeanceManagement.vue`.
 *
 * #224/#315 : le schéma cache + revalidation d'arrière-plan des séances est porté
 * par `useCachedResource` (à la place du cache manuel `readCache`/`writeCache`).
 * Mise en cache CONDITIONNELLE — seulement sans filtre enseignant/classe — et clé
 * SCOPÉE par `days` (`seances_management_d<days>`) : `days` est un paramètre serveur
 * qui ne rentre pas dans `noActiveFilter`, donc sans scoping passer de 30 à 7 jours
 * servirait la liste 30 j périmée sous la même clé. La purge après toggle visio se
 * fait via `clearCacheByPrefix('seances_management')` (cf. `useSeanceManagement`).
 * `immediate: false` conserve le comportement d'origine : le composant déclenche le
 * chargement (pas d'auto-load au setup).
 */
export function useCoordinatorSeances() {
  const classes = ref([])
  const enseignants = ref([])
  const filters = reactive({
    days: 30,
    teacher_id: null,
    classe_id: null
  })

  // Le cache n'est valide que pour la liste NON filtrée (par enseignant/classe).
  const noActiveFilter = () => !filters.teacher_id && !filters.classe_id

  const loadClasses = async () => {
    try {
      console.log('[CLASSES] Chargement...')
      // #26 : source unique des classes brutes = klassciService (/proxy/classes),
      // qui renvoie directement le tableau (déballe response.data).
      classes.value = await klassciService.getClasses()
      console.log(`[OK] ${classes.value.length} classes chargées`)
    } catch (err) {
      console.error('[ERREUR] Chargement classes:', err)
    }
  }

  const loadEnseignants = async () => {
    try {
      console.log('[ENSEIGNANTS] Chargement...')
      const response = await lmsService.getEnseignants()

      if (response && response.success) {
        enseignants.value = extractList(response)
        console.log(`[OK] ${enseignants.value.length} enseignants chargés`)
      }
    } catch (err) {
      console.error('[ERREUR] Chargement enseignants:', err)
    }
  }

  /**
   * Récupère les séances selon les filtres courants. Rejette (avec `userMessage`)
   * sur erreur réseau ou `success:false`, pour que `useCachedResource` renseigne
   * `error` en conservant l'affichage précédent. Préserve les messages d'origine.
   */
  async function fetchSeances() {
    const params = {}
    if (filters.days) params.days = filters.days
    if (filters.teacher_id) params.teacher_id = filters.teacher_id
    if (filters.classe_id) params.classe_id = filters.classe_id

    let data
    try {
      data = await lmsService.getUpcomingSeances(params)
    } catch (err) {
      err.userMessage = 'Impossible de charger les séances. Veuillez réessayer.'
      throw err
    }

    if (!data.success) {
      const err = new Error('Erreur lors du chargement des séances')
      err.userMessage = 'Erreur lors du chargement des séances'
      throw err
    }

    return Array.isArray(data.data) ? data.data : (data.data.seances || [])
  }

  const { data, loading, error, load, refresh } = useCachedResource(
    () => `seances_management_d${filters.days}`,
    fetchSeances,
    { cacheable: noActiveFilter, immediate: false }
  )

  const seances = computed(() => data.value ?? [])

  // Appelée au montage ET à chaque changement de filtre par le composant.
  const loadSeances = () => load()

  return {
    loading,
    error,
    seances,
    classes,
    enseignants,
    filters,
    loadClasses,
    loadEnseignants,
    loadSeances,
    // Conservé pour compat d'API ; revalidation d'arrière-plan via le socle.
    refreshInBackground: refresh
  }
}
