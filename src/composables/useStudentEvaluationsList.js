import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import evaluationService from '@/services/evaluation'
import api, { auth } from '@/services/api'
import { isExpired } from '@/utils/studentEvaluationStatus'
import { toast } from '@/composables/useToast'

/**
 * Couche données de StudentEvaluationsList (H2 ≤300) : charge les évaluations de
 * l'étudiant, les répartit en « à faire / terminées / s'entraîner » et pilote la
 * navigation (démarrer / continuer / résultats). La logique de statut pure vit
 * dans `utils/studentEvaluationStatus`. La vue ne fait plus que câbler.
 */
export function useStudentEvaluationsList() {
  const router = useRouter()

  const evaluations = ref([])
  const loading = ref(false)
  const error = ref(null)
  const user = ref(null)

  // Évaluations à faire : fenêtre ouverte ou pas encore commencée, pas de soumission terminée
  const evaluationsAFaire = computed(() => {
    return evaluations.value.filter(e => {
      const hasFinishedSubmission = e.student_submission &&
        (e.student_submission.status === 'soumis' || e.student_submission.status === 'corrige')
      if (hasFinishedSubmission) return false

      // Si en cours de tentative, toujours montrer
      if (e.student_submission?.status === 'en_cours') return true

      // Pas encore passée ou fenêtre ouverte
      return !isExpired(e)
    })
  })

  // Évaluations terminées avec soumission
  const evaluationsTerminees = computed(() => {
    return evaluations.value.filter(e => {
      return e.student_submission &&
        (e.student_submission.status === 'soumis' || e.student_submission.status === 'corrige')
    })
  })

  // Évaluations passées sans soumission terminée (pour s'entraîner)
  const evaluationsEntrainement = computed(() => {
    return evaluations.value.filter(e => {
      const hasFinishedSubmission = e.student_submission &&
        (e.student_submission.status === 'soumis' || e.student_submission.status === 'corrige')
      if (hasFinishedSubmission) return false
      if (e.student_submission?.status === 'en_cours') return false

      // Seulement les évaluations passées
      return isExpired(e)
    })
  })

  async function loadEvaluations() {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/evaluations/student')

      if (response.success && response.data) {
        evaluations.value = response.data
      } else if (Array.isArray(response.data)) {
        evaluations.value = response.data
      } else if (Array.isArray(response)) {
        evaluations.value = response
      } else {
        evaluations.value = []
      }
    } catch (err) {
      console.error('[ERREUR] Erreur chargement évaluations:', err)
      if (err.response?.status === 401) {
        error.value = 'Session expirée. Veuillez vous reconnecter.'
      } else {
        error.value = err.response?.data?.message || 'Impossible de charger vos évaluations. Veuillez réessayer.'
      }
    } finally {
      loading.value = false
    }
  }

  async function startEvaluation(evaluation) {
    if (!user.value) return

    try {
      const result = await evaluationService.startEvaluation(evaluation.id, user.value.klassci_id)
      if (result.success) {
        const query = { submission_id: result.data.id }
        if (result.is_practice) query.practice = '1'
        router.push({
          name: 'TakeEvaluation',
          params: { id: evaluation.id },
          query
        })
      } else {
        toast.error(result.message || 'Impossible de démarrer l\'évaluation')
      }
    } catch (err) {
      console.error('Erreur démarrage évaluation:', err)
      const message = err.response?.data?.message || 'Impossible de démarrer l\'évaluation'
      toast.error(message)
    }
  }

  function continueEvaluation(evaluation) {
    router.push({
      name: 'TakeEvaluation',
      params: { id: evaluation.id },
      query: { submission_id: evaluation.student_submission.id }
    })
  }

  function viewResults(evaluation) {
    router.push({
      name: 'EvaluationResults',
      params: { id: evaluation.id }
    })
  }

  onMounted(() => {
    user.value = auth.getUser()
    if (!user.value) {
      router.push('/login')
      return
    }
    loadEvaluations()
  })

  return {
    evaluations, loading, error, user,
    evaluationsAFaire, evaluationsTerminees, evaluationsEntrainement,
    loadEvaluations, startEvaluation, continueEvaluation, viewResults,
  }
}
