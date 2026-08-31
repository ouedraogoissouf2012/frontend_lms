import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
import { extractList } from '@/utils/apiList'

/**
 * Couche données d'AdminSeances (#G1 ≤300) : charge les séances de visioconférence
 * (avec cache + rafraîchissement en arrière-plan), les enseignants et les classes
 * pour les filtres, et expose les filtres + actions. La vue ne fait plus que câbler.
 */
export function useAdminSeances() {
  const loading = ref(true)
  const error = ref(null)
  const seances = ref([])
  const teachers = ref([])
  const classes = ref([])

  const filters = ref({
    days: '30',
    teacher_id: '',
    classe_id: '',
    status: ''
  })

  async function loadSeances() {
    loading.value = true
    error.value = null

    try {
      // Tenter de charger depuis le cache
      if (!filters.value.teacher_id && !filters.value.classe_id) {
        const cached = readCache('admin_seances')
        if (cached) {
          console.log('[CACHE] Séances admin chargées depuis le cache')
          seances.value = cached
          loading.value = false
          refreshInBackground()
          return
        }
      }

      // Charger depuis l'API
      const response = await klassciService.getSeances({
        days: filters.value.days,
        teacher_id: filters.value.teacher_id,
        classe_id: filters.value.classe_id
      })

      if (response.success) {
        seances.value = extractList(response)

        // Mettre en cache si aucun filtre actif
        if (!filters.value.teacher_id && !filters.value.classe_id) {
          writeCache('admin_seances', seances.value)
        }
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des séances')
      }
    } catch (err) {
      console.error('❌ Erreur chargement séances:', err)
      error.value = err.message || 'Impossible de charger les séances'
    } finally {
      loading.value = false
    }
  }

  async function refreshInBackground() {
    try {
      const response = await klassciService.getSeances({
        days: filters.value.days
      })

      if (response.success) {
        seances.value = extractList(response)
        writeCache('admin_seances', seances.value)
        console.log('[CACHE] Séances admin rafraîchies en arrière-plan')
      }
    } catch (err) {
      console.warn('[CACHE] Erreur rafraîchissement:', err)
    }
  }

  async function loadTeachers() {
    try {
      const response = await klassciService.getTeachers()
      teachers.value = response || []
    } catch (err) {
      console.error('❌ Erreur chargement enseignants:', err)
    }
  }

  async function loadClasses() {
    try {
      const classesData = await klassciService.getClasses()
      classes.value = classesData || []
    } catch (err) {
      console.error('❌ Erreur chargement classes:', err)
    }
  }

  function refreshData() {
    loadSeances()
    loadTeachers()
    loadClasses()
  }

  function viewSeanceDetails(seance) {
    // TODO: Ouvrir modal avec détails ou naviguer vers page détails
    console.log('Voir détails séance:', seance)
  }

  function enableVisio(seance) {
    // TODO: Activer la visioconférence pour cette séance
    console.log('Activer visio pour séance:', seance)
  }

  onMounted(() => {
    loadSeances()
    loadTeachers()
    loadClasses()
  })

  return {
    loading, error, seances, teachers, classes, filters,
    loadSeances, refreshData, viewSeanceDetails, enableVisio,
  }
}
