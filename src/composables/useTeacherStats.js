import { onMounted } from 'vue'
import { klassciService } from '@/services/klassci'
import { useCachedResource } from '@/composables/useCachedResource'

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
  // #224 : stale-while-revalidate (useCachedResource) — sert les stats en cache
  // même périmées + revalide en arrière-plan (plus de blocage à l'expiration).
  const { data: stats, loading, error, load } = useCachedResource(
    'teacher_stats',
    async () => mapDashboardToStats(await klassciService.getTeacherDashboard()),
    { immediate: false },
  )

  function loadStats() {
    return load()
  }

  onMounted(() => {
    loadStats()
  })

  return { stats, loading, error, loadStats }
}
