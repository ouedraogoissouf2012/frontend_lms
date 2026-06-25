import { ref, onMounted } from 'vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'

/**
 * Couche données du Dashboard Étudiant (#G1 ≤300) : charge les données KLASSCI
 * de l'étudiant, gère le cache local (lecture immédiate + rafraîchissement en
 * arrière-plan) et l'état d'erreur. La vue ne fait plus que câbler.
 */
export function useStudentDashboard() {
  const user = ref(null)
  const dashboardData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  function loadCachedData() {
    const data = readCache('student_dashboard')
    if (data !== null) {
      console.log('[CACHE] Données chargées depuis le cache')
      dashboardData.value = data
      return true
    }
    return false
  }

  function saveCacheData(data) {
    writeCache('student_dashboard', data)
    console.log('[CACHE] Données sauvegardées dans le cache')
  }

  async function loadDashboard(forceRefresh = false) {
    // Charger depuis le cache si disponible et pas de refresh forcé
    if (!forceRefresh && loadCachedData()) {
      loading.value = false
      // Charger les nouvelles données en arrière-plan
      refreshInBackground()
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('[DASHBOARD] Chargement dashboard étudiant...')
      dashboardData.value = await klassciService.getStudentDashboard()
      console.log('[OK] Dashboard chargé:', dashboardData.value)

      // Sauvegarder dans le cache
      saveCacheData(dashboardData.value)
    } catch (err) {
      console.error('[ERREUR] Erreur chargement dashboard:', err)
      error.value = 'Impossible de charger vos données. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  async function refreshInBackground() {
    try {
      console.log('[BACKGROUND] Rafraîchissement des données...')
      const freshData = await klassciService.getStudentDashboard()
      dashboardData.value = freshData
      saveCacheData(freshData)
      console.log('[BACKGROUND] Données rafraîchies')
    } catch (error) {
      console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
    }
  }

  onMounted(() => {
    user.value = auth.getUser()
    console.log('[USER] Student User:', user.value)
    loadDashboard()
  })

  return { user, dashboardData, loading, error, loadDashboard }
}
