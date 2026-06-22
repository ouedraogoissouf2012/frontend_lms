import { ref, onMounted } from 'vue'
import { klassciService } from '@/services/klassci'

/**
 * Couche données d'AdminHub (#G1 ≤300) : charge en parallèle les compteurs
 * (classes, matières, enseignants) et les statistiques du dashboard admin.
 * La vue ne fait plus que câbler l'affichage.
 */
export function useAdminHub() {
  const loading = ref(true)
  const stats = ref({
    classes: 0,
    matieres: 0,
    enseignants: 0,
    etudiants: 0,
    seances: 0,
    evaluations: 0
  })

  async function loadStats() {
    loading.value = true

    try {
      // Charger les données en parallèle
      const [classes, matieres, enseignants, dashboard] = await Promise.all([
        klassciService.getClasses().catch(() => []),
        klassciService.getMatieres().catch(() => []),
        klassciService.getEnseignants().catch(() => []),
        klassciService.getAdminDashboard().catch(() => ({}))
      ])

      // Compter les classes
      stats.value.classes = Array.isArray(classes) ? classes.length : 0

      // Compter les matières
      stats.value.matieres = Array.isArray(matieres) ? matieres.length : 0

      // Compter les enseignants
      stats.value.enseignants = Array.isArray(enseignants) ? enseignants.length : 0

      // Stats depuis le dashboard
      stats.value.etudiants = dashboard?.total_etudiants || dashboard?.nb_etudiants || 0
      stats.value.seances = dashboard?.total_seances || dashboard?.nb_seances || 0
      stats.value.evaluations = dashboard?.total_evaluations || dashboard?.nb_evaluations || 0

      console.log('[ADMIN HUB] Stats chargées:', stats.value)
    } catch (error) {
      console.error('[ADMIN HUB] Erreur chargement stats:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadStats()
  })

  return { loading, stats, loadStats }
}
