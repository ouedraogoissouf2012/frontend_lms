import { ref, computed, onMounted } from 'vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import { useCachedResource } from '@/composables/useCachedResource'

/**
 * Couche données du Dashboard Étudiant (#G1 ≤300).
 *
 * #224 : le cache passe en stale-while-revalidate via {@see useCachedResource} —
 * on sert immédiatement l'entrée en cache (MÊME périmée) puis on revalide en
 * arrière-plan, au lieu de bloquer l'utilisateur sur l'écran de chargement dès
 * que le TTL de 5 min est dépassé. La vue ne fait que câbler.
 */
export function useStudentDashboard() {
  const user = ref(null)

  const { data: dashboardData, loading, error, canRetry, motif, load, refresh } = useCachedResource(
    'student_dashboard',
    () => klassciService.getStudentDashboard(),
    { immediate: false },
  )

  // Refus motivé `enrolment_not_active` (StudentEnrolmentService) : un état clair, pas une panne ; la
  // donnée en cache (une ancienne classe) ne doit plus être montrée.
  const inscriptionInactive = computed(() => motif.value === 'enrolment_not_active')

  /** `forceRefresh` (bouton « réessayer ») → revalidation directe ; sinon SWR. */
  function loadDashboard(forceRefresh = false) {
    return forceRefresh ? refresh() : load()
  }

  onMounted(() => {
    user.value = auth.getUser()
    loadDashboard()
  })

  return { user, dashboardData, loading, error, canRetry, inscriptionInactive, loadDashboard }
}
