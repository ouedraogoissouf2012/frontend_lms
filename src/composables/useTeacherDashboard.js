import { ref, onMounted } from 'vue'
import { formatDateLong } from '@/utils/formatters'
import { useRouter } from 'vue-router'
import { auth, dashboard as dashboardService } from '@/services/api'
import { klassciService } from '@/services/klassci'
import lmsService from '@/services/lms'
import { clearCache, readCache, writeCache } from '@/services/cache'
import {
  buildTeacherDashboardFallback,
  hasDashboardContent,
  normalizeTeacherDashboard,
  normalizeTeacherDashboardPayload,
} from '@/utils/teacherDashboard'

const CACHE_NAME = 'teacher_dashboard'

/**
 * Couche données du dashboard enseignant (#H11 ≤300) : utilisateur courant +
 * dashboard KLASSCI (matières/classes/évaluations/statistiques) avec cache,
 * navigation vers une matière et formatage de date. La vue ne fait que câbler.
 */
export function useTeacherDashboard() {
  const router = useRouter()

  const user = ref(null)
  const dashboardData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function loadFallbackDashboard() {
    const localDashboard = normalizeTeacherDashboardPayload(
      await dashboardService.getTeacherDashboard().catch(() => null)
    )
    if (hasDashboardContent(localDashboard)) return localDashboard
    return await buildTeacherDashboardFallback(lmsService, user.value)
  }

  async function loadDashboard(forceRefresh = false) {
    // Vérifier le cache si pas de force refresh
    if (!forceRefresh) {
      const data = normalizeTeacherDashboard(readCache(CACHE_NAME))
      if (hasDashboardContent(data)) {
        dashboardData.value = data
        return
      }
      clearCache(CACHE_NAME)
    }

    loading.value = true
    error.value = null

    try {
      const data = normalizeTeacherDashboard(await klassciService.getTeacherDashboard())
      if (hasDashboardContent(data)) {
        dashboardData.value = data
        writeCache(CACHE_NAME, data)
        return
      }

      const apiFallback = await loadFallbackDashboard()
      dashboardData.value = hasDashboardContent(apiFallback) ? apiFallback : data
      if (hasDashboardContent(dashboardData.value)) {
        writeCache(CACHE_NAME, dashboardData.value)
      }
    } catch (err) {
      const cachedFallback = normalizeTeacherDashboard(readCache(CACHE_NAME))
      if (hasDashboardContent(cachedFallback)) {
        dashboardData.value = normalizeTeacherDashboard(cachedFallback)
        error.value = null
        return
      }

      const apiFallback = await loadFallbackDashboard()
      dashboardData.value = apiFallback
      if (hasDashboardContent(apiFallback)) {
        writeCache(CACHE_NAME, apiFallback)
      }
      error.value = null
    } finally {
      loading.value = false
    }
  }

  // #283 : délègue au formatter canonique (repli local conservé).
  function formatDate(dateString) {
    return formatDateLong(dateString, { fallback: 'N/A' })
  }

  function navigateToMatiere(matiere) {
    // L'id peut arriver sous plusieurs formes selon la source (KLASSCI/LMS).
    const matiereId = matiere.matiere_id || matiere.id || matiere.matiere?.id

    if (matiereId) {
      router.push({
        name: 'matiere-details',
        params: { id: matiereId }
      })
    } else {
      error.value = 'Impossible de naviguer vers cette matière'
    }
  }

  onMounted(() => {
    user.value = auth.getUser()

    // Charger le dashboard KLASSCI
    loadDashboard()
  })

  return {
    user, dashboardData, loading, error,
    loadDashboard, formatDate, navigateToMatiere,
  }
}
