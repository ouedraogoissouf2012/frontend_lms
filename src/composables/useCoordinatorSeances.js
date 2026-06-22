import { ref, reactive } from 'vue'
import lmsService from '@/services/lms'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'

/**
 * Composable de données des séances côté coordinateur (G7).
 *
 * Encapsule l'état réactif (séances, classes, enseignants, filtres) et les
 * appels API de chargement (LMS + KLASSCI, avec cache `seances_management` et
 * rafraîchissement en arrière-plan). Extrait du god-component
 * `SeanceManagement.vue` — comportement, logs et clés de cache identiques.
 */
export function useCoordinatorSeances() {
  // État réactif
  const loading = ref(false)
  const error = ref(null)
  const seances = ref([])
  const classes = ref([])
  const enseignants = ref([])
  const filters = reactive({
    days: 30,
    teacher_id: null,
    classe_id: null
  })

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
        enseignants.value = response.data || []
        console.log(`[OK] ${enseignants.value.length} enseignants chargés`)
      }
    } catch (err) {
      console.error('[ERREUR] Chargement enseignants:', err)
    }
  }

  const loadSeances = async () => {
    // Try cache first
    if (!filters.teacher_id && !filters.classe_id) {
      const cachedEntry = readCache('seances_management')
      if (cachedEntry !== null && cachedEntry.filterState?.days === filters.days) {
        console.log('[CACHE] Séances chargées depuis le cache')
        seances.value = cachedEntry.data
        loading.value = false
        refreshInBackground()
        return
      }
    }

    loading.value = true
    error.value = null

    try {
      console.log('[SEANCES] Chargement à venir...')

      const params = {}
      if (filters.days) params.days = filters.days
      if (filters.teacher_id) params.teacher_id = filters.teacher_id
      if (filters.classe_id) params.classe_id = filters.classe_id

      const data = await lmsService.getUpcomingSeances(params)

      console.log('[OK] Séances reçues:', data)

      if (data.success) {
        seances.value = Array.isArray(data.data) ? data.data : (data.data.seances || [])
        console.log(`[OK] ${seances.value.length} séances chargées`)

        // Save to cache only if no filters applied
        if (!filters.teacher_id && !filters.classe_id) {
          writeCache('seances_management', {
            data: seances.value,
            filterState: { days: filters.days }
          })
        }
      } else {
        error.value = 'Erreur lors du chargement des séances'
      }
    } catch (err) {
      console.error('[ERREUR] Chargement séances:', err)
      error.value = 'Impossible de charger les séances. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  // Refresh in background
  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement séances...')

      const params = { days: filters.days }
      const data = await lmsService.getUpcomingSeances(params)

      if (data.success) {
        seances.value = Array.isArray(data.data) ? data.data : (data.data.seances || [])

        writeCache('seances_management', {
          data: seances.value,
          filterState: { days: filters.days }
        })

        console.log('[BACKGROUND] Rafraîchissement terminé')
      }
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

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
    refreshInBackground
  }
}
