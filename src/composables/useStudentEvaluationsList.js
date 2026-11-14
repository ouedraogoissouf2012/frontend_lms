import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api, { auth } from '@/services/api'
import { isExpired, copieRendue, copieHorsDelai } from '@/utils/studentEvaluationStatus'
import { endpoints } from '@/services/endpoints'
import { messageDe } from '@/services/errorHandler'
import { estPannePassagere } from '@/utils/pannePassagere'
import { useStartEvaluation } from '@/composables/useStartEvaluation'

/**
 * Couche données de StudentEvaluationsList (H2 ≤300) : charge les évaluations de
 * l'étudiant, les répartit en « à faire / terminées / s'entraîner » et pilote la
 * navigation (démarrer / continuer / résultats). La logique de statut pure vit
 * dans `utils/studentEvaluationStatus`. La vue ne fait plus que câbler.
 */
export function useStudentEvaluationsList() {
  const router = useRouter()
  // La seule porte d'une évaluation, partagée avec le calendrier et la page d'une matière.
  const { startEvaluation, continueEvaluation } = useStartEvaluation()

  const evaluations = ref([])
  const loading = ref(false)
  const error = ref(null)
  // Un nouvel essai seulement sur une panne passagère (5xx, 429, réseau) : un refus définitif ne se
  // lève pas en réessayant (lot « retour honnête », 10/11).
  const canRetry = ref(true)
  const user = ref(null)

  // Évaluations à faire : fenêtre ouverte ou pas encore commencée, pas de soumission terminée
  const evaluationsAFaire = computed(() => {
    return evaluations.value.filter(e => {
      if (copieRendue(e.student_submission)) return false
      // C28 (D-28f) : une copie hors délai n'est plus à faire.
      if (copieHorsDelai(e.student_submission)) return false

      // Si en cours de tentative, toujours montrer
      if (e.student_submission?.status === 'en_cours') return true

      // Pas encore passée ou fenêtre ouverte
      return !isExpired(e)
    })
  })

  // Évaluations terminées avec soumission
  const evaluationsTerminees = computed(() => {
    return evaluations.value.filter(e => {
      return copieRendue(e.student_submission)
    })
  })

  // Évaluations passées sans soumission terminée (pour s'entraîner)
  const evaluationsEntrainement = computed(() => {
    return evaluations.value.filter(e => {
      if (copieRendue(e.student_submission)) return false
      // C28 (D-28f) : une copie hors délai va TOUJOURS avec les évaluations passées.
      if (copieHorsDelai(e.student_submission)) return true
      if (e.student_submission?.status === 'en_cours') return false

      // Seulement les évaluations passées
      return isExpired(e)
    })
  })

  async function loadEvaluations() {
    loading.value = true
    error.value = null
    canRetry.value = true

    try {
      const response = await api.get(endpoints.evaluations.student)

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
      // Message sûr posé par l'intercepteur selon le `reason` du serveur (D0) : un 401
      // `klassci_token_missing` n'est pas une session expirée, et le texte du serveur
      // n'atteint jamais l'écran.
      error.value = messageDe(err)
      canRetry.value = estPannePassagere(err)
    } finally {
      loading.value = false
    }
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
    evaluations, loading, error, canRetry, user,
    evaluationsAFaire, evaluationsTerminees, evaluationsEntrainement,
    loadEvaluations, startEvaluation, continueEvaluation, viewResults,
  }
}
