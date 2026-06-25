import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'

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

  async function loadDashboard(forceRefresh = false) {
    // Vérifier le cache si pas de force refresh
    if (!forceRefresh) {
      const data = readCache('teacher_dashboard')
      if (data !== null) {
        console.log('📦 Dashboard enseignant chargé depuis le cache')
        dashboardData.value = data
        return
      }
    }

    loading.value = true
    error.value = null

    try {
      console.log('fa-bar-chart Chargement dashboard enseignant depuis KLASSCI...')
      const data = await klassciService.getTeacherDashboard()
      dashboardData.value = data

      // Mettre en cache
      writeCache('teacher_dashboard', data)

      console.log('fa-check-circle Dashboard chargé:', data)

      // Logs détaillés pour debug
      if (data) {
        console.log('fa-book Matières:', data.matieres)
        console.log('🏫 Classes:', data.classes)
        console.log('fa-pencil Évaluations:', data.evaluations)
        console.log('fa-bar-chart Stats:', data.statistiques)
      }
    } catch (err) {
      console.error('fa-times-circle Erreur chargement dashboard:', err)
      error.value = 'Impossible de charger vos données. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function navigateToMatiere(matiere) {
    console.log('fa-search Structure matière reçue:', matiere)

    // Essayer différentes propriétés
    const matiereId = matiere.matiere_id || matiere.id || matiere.matiere?.id

    if (matiereId) {
      console.log('fa-book Navigation vers matière:', matiereId)
      router.push({
        name: 'matiere-details',
        params: { id: matiereId }
      })
    } else {
      console.error('fa-times-circle ID matière non trouvé:', matiere)
      error.value = 'Impossible de naviguer vers cette matière'
    }
  }

  onMounted(() => {
    user.value = auth.getUser()
    console.log('fa-user Teacher User:', user.value)

    // Charger le dashboard KLASSCI
    loadDashboard()
  })

  return {
    user, dashboardData, loading, error,
    loadDashboard, formatDate, navigateToMatiere,
  }
}
