import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import evaluationService from '@/services/evaluation'
import { auth } from '@/services/api'

/**
 * Couche données de TakeEvaluation (H1 ≤300) : chargement de l'évaluation,
 * gestion des réponses (QCM simple/multiple, vrai-faux, courte, dissertation),
 * timers (temps imparti + fenêtre temporelle), soumission et résultats.
 * Services, routes, payloads, alertes/confirm et logs strictement identiques à
 * l'original (conversion Options API → Composition API sans changement de logique).
 */
export function useTakeEvaluation() {
  // Pont route/router via l'instance (compatible global.mocks.$route des tests de
  // montage, et réactif en prod) — voir specs decomposition-300.
  const inst = getCurrentInstance()
  const router = inst.proxy.$router
  const route = computed(() => inst.proxy.$route)

  const evaluation = ref(null)
  const answers = ref({})
  const loading = ref(true)
  const submitting = ref(false)
  const error = ref(null)
  const user = ref(null)
  const submissionId = ref(null)
  const timeRemaining = ref(0)
  const timer = ref(null)
  const windowTimeLeft = ref(null)
  const timeCheckInterval = ref(null)
  const showConfirmModal = ref(false)
  const showResultsModal = ref(false)
  const results = ref(null)
  const isPractice = ref(false)

  const answeredCount = computed(() => {
    return Object.values(answers.value).filter(answer => {
      if (Array.isArray(answer)) return answer.length > 0
      return answer !== undefined && answer !== null && answer !== ''
    }).length
  })

  const progressPercentage = computed(() => {
    if (!evaluation.value || !evaluation.value.questions) return 0
    return Math.round((answeredCount.value / evaluation.value.questions.length) * 100)
  })

  async function loadEvaluation() {
    loading.value = true
    try {
      const id = route.value.params.id
      const result = await evaluationService.getEvaluation(id)

      if (result.success) {
        evaluation.value = result.data

        // Initialiser les réponses
        evaluation.value.questions.forEach(question => {
          if (question.type === 'qcm_multiple') {
            answers.value[question.id] = []
          } else {
            answers.value[question.id] = ''
          }
        })

        // Initialiser le temps restant fenêtre
        if (evaluation.value.programmation?.window) {
          windowTimeLeft.value = evaluation.value.programmation.window.time_left_minutes
        }

        // Démarrer le timer
        timeRemaining.value = evaluation.value.duree_minutes * 60
        startTimer()
        startWindowTimeTracking()
      } else {
        error.value = 'Évaluation non trouvée'
      }
    } catch (error_) {
      console.error('Erreur chargement évaluation:', error_)
      error.value = 'Impossible de charger l\'évaluation'
    } finally {
      loading.value = false
    }
  }

  function startTimer() {
    timer.value = setInterval(() => {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        clearInterval(timer.value)
        alert('Temps écoulé ! Votre évaluation va être soumise automatiquement.')
        submitEvaluation()
      }
    }, 1000)
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function formatTimeLeft(minutes) {
    if (minutes === null || minutes <= 0) return '0 min'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins.toString().padStart(2, '0')}min`
    return `${mins} min`
  }

  function startWindowTimeTracking() {
    timeCheckInterval.value = setInterval(async () => {
      await checkWindowTimeRemaining()
    }, 30000)
  }

  async function checkWindowTimeRemaining() {
    try {
      const result = await evaluationService.getTimeStatus(evaluation.value.id)
      if (result.success && result.data.window) {
        const window = result.data.window
        windowTimeLeft.value = window.time_left_minutes

        if (window.has_ended && !submitting.value) {
          clearInterval(timeCheckInterval.value)
          clearInterval(timer.value)
          alert('La fenêtre d\'évaluation est fermée. Soumission automatique de vos réponses...')
          await submitEvaluation()
        }
      }
    } catch (error_) {
      console.error('Erreur vérification temps fenêtre:', error_)
    }
  }

  function isAnswered(questionId) {
    const answer = answers.value[questionId]
    if (Array.isArray(answer)) return answer.length > 0
    return answer !== undefined && answer !== null && answer !== ''
  }

  function isOptionSelected(questionId, option) {
    return Array.isArray(answers.value[questionId]) && answers.value[questionId].includes(option)
  }

  function toggleMultipleChoice(questionId, option) {
    if (!Array.isArray(answers.value[questionId])) {
      answers.value[questionId] = []
    }
    const index = answers.value[questionId].indexOf(option)
    if (index > -1) {
      answers.value[questionId].splice(index, 1)
    } else {
      answers.value[questionId].push(option)
    }
  }

  function confirmCancel() {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Vos réponses ne seront pas sauvegardées.')) {
      router.push('/student/evaluations-list')
    }
  }

  function confirmSubmit() {
    showConfirmModal.value = true
  }

  async function submitEvaluation() {
    showConfirmModal.value = false
    submitting.value = true

    try {
      if (timer.value) clearInterval(timer.value)
      if (timeCheckInterval.value) clearInterval(timeCheckInterval.value)

      const result = await evaluationService.submitEvaluation(
        evaluation.value.id,
        submissionId.value,
        answers.value
      )

      if (result.success) {
        results.value = result.data
        showResultsModal.value = true
      }
    } catch (error_) {
      console.error('Erreur soumission évaluation:', error_)
      alert('Erreur lors de la soumission de l\'évaluation')
    } finally {
      submitting.value = false
    }
  }

  function returnToEvaluations() {
    router.push('/student/evaluations-list')
  }

  onMounted(async () => {
    user.value = auth.getUser()
    if (!user.value) {
      router.push('/login')
      return
    }

    submissionId.value = route.value.query.submission_id
    isPractice.value = route.value.query.practice === '1'
    if (!submissionId.value) {
      error.value = 'ID de soumission manquant'
      loading.value = false
      return
    }

    await loadEvaluation()
  })

  onBeforeUnmount(() => {
    if (timer.value) clearInterval(timer.value)
    if (timeCheckInterval.value) clearInterval(timeCheckInterval.value)
  })

  return {
    evaluation, answers, loading, submitting, error,
    submissionId, timeRemaining, windowTimeLeft,
    showConfirmModal, showResultsModal, results, isPractice,
    answeredCount, progressPercentage,
    loadEvaluation, formatTime, formatTimeLeft,
    isAnswered, isOptionSelected, toggleMultipleChoice,
    confirmCancel, confirmSubmit, submitEvaluation, returnToEvaluations,
  }
}
