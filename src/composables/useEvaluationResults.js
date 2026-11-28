import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { refusMotive } from '@/services/errorHandler'
import { etatDuCorrige } from '@/utils/diffusionDesResultats'

/**
 * Couche données de EvaluationResults (H2 ≤300) : charge la copie de l'étudiant pour une
 * évaluation et en dérive l'état du corrigé. La vue ne fait que câbler.
 *
 * front#693 (contrat back #1773) : l'état du corrigé vient du serveur et du mode choisi par
 * l'enseignant ({@link etatDuCorrige}). L'ancien délai fixe de 7 jours après la remise, recalculé
 * ici quand l'API ne donnait pas de date, est retiré : il annonçait une date à un corrigé qui
 * n'ouvrirait jamais.
 */
export function useEvaluationResults() {
  const route = useRoute()

  const submission = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const etatCorrige = computed(() => etatDuCorrige(submission.value))
  const isCorrectionAvailable = computed(() => etatCorrige.value.ouvert)

  async function loadResults() {
    try {
      const evaluationId = route.params.id
      const result = await api.get(endpoints.evaluations.mySubmission(evaluationId))

      if (result.success) {
        submission.value = result.data
      } else {
        error.value = refusMotive(result).motif ?? 'Résultats non disponibles'
      }
    } catch (err) {
      console.error('Erreur chargement résultats:', err)
      error.value = 'Impossible de charger vos résultats'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadResults()
  })

  return { submission, loading, error, isCorrectionAvailable, etatCorrige, loadResults }
}
