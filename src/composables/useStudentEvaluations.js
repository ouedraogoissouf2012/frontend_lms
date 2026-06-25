import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import evaluationService from '@/services/evaluation'
import { auth } from '@/services/api'

/**
 * Couche données de StudentEvaluations (H2 ≤300) : charge les évaluations de
 * l'étudiant connecté (identité dérivée du token, anti-IDOR #17 Ék-6) et pilote
 * les actions de navigation (démarrer / continuer / refaire). La vue ne câble plus.
 */
export function useStudentEvaluations() {
  const router = useRouter()

  const evaluations = ref([])
  const loading = ref(true)
  const error = ref(null)
  const user = ref(null)

  async function loadEvaluations() {
    loading.value = true
    error.value = null
    try {
      // #17 Ék-6 : évals de l'étudiant connecté (identité dérivée du token, anti-IDOR)
      const result = await evaluationService.getStudentEvaluations()
      if (result.success) {
        evaluations.value = result.data
      } else {
        error.value = 'Erreur lors du chargement des évaluations'
      }
    } catch (err) {
      console.error('Erreur chargement évaluations:', err)
      error.value = 'Impossible de charger les évaluations'
    } finally {
      loading.value = false
    }
  }

  async function startEvaluation(evaluation) {
    try {
      const result = await evaluationService.startEvaluation(evaluation.id, user.value.klassci_id)
      if (result.success) {
        router.push({
          name: 'TakeEvaluation',
          params: { id: evaluation.id },
          query: { submission_id: result.data.id }
        })
      }
    } catch (err) {
      console.error('Erreur démarrage évaluation:', err)
      alert('Impossible de démarrer l\'évaluation')
    }
  }

  function continueEvaluation(evaluation) {
    router.push({
      name: 'TakeEvaluation',
      params: { id: evaluation.id },
      query: { submission_id: evaluation.student_submission.id }
    })
  }

  async function retakeEvaluation(evaluation) {
    await startEvaluation(evaluation)
  }

  onMounted(async () => {
    user.value = auth.getUser()
    if (!user.value) {
      router.push('/login')
      return
    }
    await loadEvaluations()
  })

  return {
    evaluations, loading, error, user,
    loadEvaluations, startEvaluation, continueEvaluation, retakeEvaluation,
  }
}
