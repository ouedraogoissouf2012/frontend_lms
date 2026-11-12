import { ref } from 'vue'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { invalidResponseError, normalizeError } from '@/services/errorHandler'
import { estPannePassagere } from '@/utils/pannePassagere'

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
  // Un nouvel essai seulement sur une panne passagère (5xx, 429, réseau) : un refus définitif ne se
  // lève pas en réessayant.
  const canRetry = ref(true)
  const matieres = ref([])
  const moyenneGenerale = ref(0)
  const totalMatieres = ref(0)
  const totalEvaluations = ref(0)
  // Les notes ont-elles été lues ? Sinon les cartes de synthèse ne s'affichent pas :
  // « 0/20 » sous un refus se lisait comme une moyenne réelle.
  const mesure = ref(false)

  async function fetchGrades() {
    loading.value = true
    error.value = null
    canRetry.value = true

    try {
      const response = await api.get(endpoints.grades.mine)

      if (response.success) {
        const data = response.data
        matieres.value = data.matieres || []
        moyenneGenerale.value = data.moyenne_generale || 0
        totalMatieres.value = data.total_matieres || 0
        totalEvaluations.value = data.total_evaluations || 0
        mesure.value = true
      } else {
        // Jamais le texte du serveur à l'écran (D0) : message du catalogue (selon le `reason`).
        const refus = invalidResponseError('GET /my-grades sans success', response)
        error.value = refus.userMessage
        // Refus définitif seulement avec un `reason` connu (règle commune d'invalidResponseError).
        canRetry.value = estPannePassagere(refus)
      }
    } catch (err) {
      console.error('Erreur récupération notes:', err)
      error.value = err.userMessage ?? normalizeError(err).userMessage
      canRetry.value = estPannePassagere(err)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    canRetry,
    matieres,
    moyenneGenerale,
    totalMatieres,
    totalEvaluations,
    mesure,
    fetchGrades
  }
}
