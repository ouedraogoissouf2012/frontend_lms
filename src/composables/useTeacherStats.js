import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'

/**
 * Construit l'objet `stats` présenté à partir du dashboard enseignant KLASSCI.
 * Mapping identique (chargement initial et rafraîchissement en arrière-plan).
 */
function mapDashboardToStats(dashboardData) {
  return {
    nb_matieres: dashboardData.matieres?.length || 0,
    nb_etudiants: dashboardData.statistiques?.total_etudiants || 0,
    nb_evaluations: dashboardData.evaluations?.length || 0,
    nb_seances: dashboardData.seances?.length || 0,
    nb_lecons: dashboardData.statistiques?.total_lecons || dashboardData.lessons?.length || 0,
    nb_corrections: dashboardData.statistiques?.corrections_effectuees || 0,
    nb_visio: dashboardData.statistiques?.visio_effectuees || 0,
    nb_messages_forum: dashboardData.statistiques?.messages_forum || 0,
    par_matiere: dashboardData.matieres || [],
    par_classe: dashboardData.classes || []
  }
}

/**
 * Couche données des statistiques enseignant (#H11 ≤300) : agrège le dashboard
 * KLASSCI en compteurs + répartitions, avec cache et rafraîchissement en
 * arrière-plan. La vue ne fait plus que câbler.
 */
export function useTeacherStats() {
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function loadStats() {
    // Vérifier le cache
    const cachedData = readCache('teacher_stats')
    if (cachedData !== null) {
      console.log('[CACHE] Stats chargées depuis le cache')
      stats.value = cachedData
      loading.value = false
      // Rafraîchir en arrière-plan
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('[STATS] Chargement des statistiques enseignant...')
      const dashboardData = await klassciService.getTeacherDashboard()

      // Construire l'objet stats à partir du dashboard
      stats.value = mapDashboardToStats(dashboardData)

      // Mettre en cache
      writeCache('teacher_stats', stats.value)

      console.log('[OK] Statistiques chargées:', stats.value)
    } catch (err) {
      console.error('[ERREUR] Erreur chargement statistiques:', err)
      error.value = 'Impossible de charger vos statistiques. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement des stats...')
      const dashboardData = await klassciService.getTeacherDashboard()

      stats.value = mapDashboardToStats(dashboardData)

      writeCache('teacher_stats', stats.value)

      console.log('[BACKGROUND] Stats rafraîchies')
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

  onMounted(() => {
    loadStats()
  })

  return { stats, loading, error, loadStats }
}
