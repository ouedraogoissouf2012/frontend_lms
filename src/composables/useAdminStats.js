import { ref, onMounted } from 'vue'
import { auth } from '@/services/api'
import { readCache, writeCache } from '@/services/cache'

/**
 * Couche données d'AdminStats (#H3 ≤300) : statistiques globales de la plateforme
 * (utilisateurs, classes/matières, séances/visio, évaluations + compteurs annexes).
 * Lecture depuis le cache puis rafraîchissement en arrière-plan, sinon depuis le
 * service auth (données synchronisées au login) avec fallback à zéro. La vue ne
 * fait plus que câbler.
 */
export function useAdminStats() {
  const loading = ref(true)
  const error = ref(null)
  const stats = ref({})
  const meta = ref(null)

  async function loadStats() {
    loading.value = true
    error.value = null

    try {
      // Tenter de charger depuis le cache
      const cached = readCache('admin_stats')
      if (cached) {
        console.log('[CACHE] Statistiques admin chargées depuis le cache')
        stats.value = cached.data
        meta.value = cached.metaData
        loading.value = false
        refreshInBackground()
        return
      }

      // Charger depuis l'auth service (données synchronisées lors du login)
      const user = auth.getUser()
      meta.value = auth.getMeta()

      if (user?.admin_data?.statistics) {
        stats.value = user.admin_data.statistics
      } else {
        // Fallback: charger depuis un endpoint si disponible
        stats.value = {
          nb_enseignants: 0,
          nb_etudiants: 0,
          nb_classes_actives: 0,
          nb_matieres_actives: 0,
          nb_filieres: 0,
          nb_niveaux: 0,
          nb_seances_actives: 0,
          nb_visios_actives: 0,
          nb_visios_scheduled: 0,
          nb_evaluations: 0,
          nb_evaluations_actives: 0,
          nb_evaluations_terminees: 0,
          nb_lessons: 0,
          nb_forum_topics: 0,
          nb_heures_cours: 0,
          taux_presence: 0
        }
      }

      // Mettre en cache
      writeCache('admin_stats', { data: stats.value, metaData: meta.value })

      console.log('✅ Statistiques chargées:', stats.value)
    } catch (err) {
      console.error('❌ Erreur chargement statistiques:', err)
      error.value = err.message || 'Impossible de charger les statistiques'
    } finally {
      loading.value = false
    }
  }

  async function refreshInBackground() {
    try {
      const user = auth.getUser()
      const newMeta = auth.getMeta()

      if (user?.admin_data?.statistics) {
        stats.value = user.admin_data.statistics
        meta.value = newMeta

        writeCache('admin_stats', { data: stats.value, metaData: meta.value })
        console.log('[CACHE] Statistiques rafraîchies en arrière-plan')
      }
    } catch (err) {
      console.warn('[CACHE] Erreur rafraîchissement:', err)
    }
  }

  function refreshData() {
    loadStats()
  }

  onMounted(() => {
    loadStats()
  })

  return {
    loading, error, stats, meta,
    loadStats, refreshInBackground, refreshData,
  }
}
