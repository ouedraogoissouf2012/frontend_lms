import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
import { enrichTeacherClasses } from '@/utils/classStats'

const TEACHER_CLASSES_CACHE_KEY = 'teacher_classes_dashboard_v2'

/**
 * Couche donnees de TeacherClasses (#H9 ≤300). Charge les classes de
 * l enseignant, les enrichit (effectifs, nb matieres) et gere cache +
 * rafraichissement en arriere-plan. La vue ne fait plus que cabler.
 */
export function useTeacherClasses() {
  const classes = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadClasses() {
    // Verifier le cache
    const cachedData = readCache(TEACHER_CLASSES_CACHE_KEY)
    if (cachedData !== null) {
      console.log('[CACHE] Classes chargées depuis le cache')
      classes.value = cachedData
      loading.value = false
      // Rafraîchir en arrière-plan
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('[CLASSES] Chargement des classes enseignant...')
      const dashboard = await klassciService.getTeacherDashboard()
      const rawClasses = Array.isArray(dashboard?.classes) ? dashboard.classes : []
      const dashboardMatieres = Array.isArray(dashboard?.matieres) ? dashboard.matieres : []

      console.log('[CLASSES] Classes brutes:', rawClasses.length)
      console.log('[CLASSES] Matières disponibles:', dashboardMatieres.length)

      // Debug: afficher la structure d'une matière pour comprendre le lien avec les classes
      if (dashboardMatieres.length > 0) {
        console.log("[DEBUG] Structure d'une matière:", dashboardMatieres[0])
      }
      if (rawClasses.length > 0) {
        console.log("[DEBUG] Structure d'une classe:", rawClasses[0])
      }

      const enrichedClasses = enrichTeacherClasses(rawClasses, dashboardMatieres)

      classes.value = enrichedClasses

      // Mettre en cache
      writeCache(TEACHER_CLASSES_CACHE_KEY, classes.value)

      console.log('[OK] Classes enrichies:', classes.value)
    } catch (err) {
      console.error('[ERREUR] Erreur chargement classes:', err)
      error.value = 'Impossible de charger vos classes. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement des classes...')
      const dashboard = await klassciService.getTeacherDashboard()
      const rawClasses = Array.isArray(dashboard?.classes) ? dashboard.classes : []
      const dashboardMatieres = Array.isArray(dashboard?.matieres) ? dashboard.matieres : []

      const enrichedClasses = enrichTeacherClasses(rawClasses, dashboardMatieres)

      classes.value = enrichedClasses

      writeCache(TEACHER_CLASSES_CACHE_KEY, classes.value)

      console.log('[BACKGROUND] Classes rafraîchies')
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

  onMounted(() => {
    loadClasses()
  })

  return { classes, loading, error, loadClasses }
}
