import { ref } from 'vue'
import api from '@/services/api'

/**
 * État + chargement des notes de l'élève (G4 — décomposition de StudentGrades.vue
 * pour ramener son <script> sous 300 lignes).
 *
 * Encapsule l'état réactif (matières/moyenne/totaux + loading/error) et l'appel
 * API `GET /my-grades`. L'identité de l'élève est dérivée du token côté backend
 * (pas de paramètre client). Comportement et payload STRICTEMENT identiques à
 * l'origine. La logique pure de présentation vit dans `@/utils/studentGrades`.
 */
export function useStudentGrades() {
  const loading = ref(false)
  const error = ref(null)
  const matieres = ref([])
  const moyenneGenerale = ref(0)
  const totalMatieres = ref(0)
  const totalEvaluations = ref(0)

  async function fetchGrades() {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/my-grades')

      if (response.success) {
        const data = response.data
        matieres.value = data.matieres || []
        moyenneGenerale.value = data.moyenne_generale || 0
        totalMatieres.value = data.total_matieres || 0
        totalEvaluations.value = data.total_evaluations || 0
      } else {
        error.value = response.message || 'Erreur lors du chargement des notes'
      }
    } catch (err) {
      console.error('Erreur récupération notes:', err)
      error.value = err.response?.data?.message || 'Erreur de connexion au serveur'
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    matieres,
    moyenneGenerale,
    totalMatieres,
    totalEvaluations,
    fetchGrades
  }
}
