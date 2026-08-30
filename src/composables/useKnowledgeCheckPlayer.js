import { ref, computed, onUnmounted } from 'vue'
import knowledgeCheckService from '@/services/knowledgeCheck'
import { toast } from '@/services/toast'

/**
 * Couche données de KnowledgeCheckPlayer (#G6 ; éclaté sous 300 lignes en H5).
 *
 * Pilote la machine à états du lecteur de quiz (intro → playing → results) :
 * démarrage d'une tentative, minuteur, sélection des réponses (choix unique /
 * multiple), navigation entre questions et soumission. Logique reprise verbatim
 * de l'ancien god-component ; les vues d'état sont des sous-composants
 * présentationnels. Les helpers purs d'affichage (formatTime, isOptionSelected,
 * getAnswerText) vivent dans ces vues.
 *
 * @param {{ quiz: object }} props
 * @param {(e: string, payload?: any) => void} emit
 */
export function useKnowledgeCheckPlayer(props, emit) {
  const state = ref('intro') // intro, playing, results
  const loading = ref(false)
  const submitting = ref(false)
  const questions = ref([])
  const answers = ref([])
  const currentIndex = ref(0)
  const startTime = ref(null)
  const timeLimit = ref(null)
  const timeRemaining = ref(0)
  let timerInterval = null

  const currentQuestion = computed(() => questions.value[currentIndex.value] || {})
  const progressPercent = computed(() =>
    questions.value.length > 0 ? ((currentIndex.value + 1) / questions.value.length) * 100 : 0
  )
  const results = ref(null)

  onUnmounted(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  })

  async function startQuiz() {
    loading.value = true

    try {
      const response = await knowledgeCheckService.startAttempt(props.quiz.id)

      if (response.success) {
        questions.value = response.data.questions
        answers.value = new Array(questions.value.length).fill(null)
        startTime.value = Date.now()
        timeLimit.value = response.data.time_limit_minutes

        if (timeLimit.value) {
          timeRemaining.value = timeLimit.value * 60
          startTimer()
        }

        state.value = 'playing'
      }
    } catch (error) {
      console.error('Erreur demarrage quiz:', error)
      toast.error('Erreur lors du demarrage du quiz')
    } finally {
      loading.value = false
    }
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      timeRemaining.value--

      if (timeRemaining.value <= 0) {
        clearInterval(timerInterval)
        submitQuiz()
      }
    }, 1000)
  }

  function selectOption(index) {
    answers.value[currentIndex.value] = index
  }

  function toggleOption(index) {
    let answer = answers.value[currentIndex.value]
    if (!Array.isArray(answer)) {
      answer = []
    }

    const idx = answer.indexOf(index)
    if (idx >= 0) {
      answer.splice(idx, 1)
    } else {
      answer.push(index)
    }

    answers.value[currentIndex.value] = [...answer]
  }

  function previousQuestion() {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function nextQuestion() {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
    }
  }

  function goToQuestion(index) {
    currentIndex.value = index
  }

  async function submitQuiz() {
    if (timerInterval) {
      clearInterval(timerInterval)
    }

    submitting.value = true

    const timeSpent = Math.round((Date.now() - startTime.value) / 1000)

    try {
      const response = await knowledgeCheckService.submitAttempt(
        props.quiz.id,
        answers.value,
        timeSpent
      )

      if (response.success) {
        results.value = response.data
        state.value = 'results'
        emit('completed', response.data)
      }
    } catch (error) {
      console.error('Erreur soumission quiz:', error)
      toast.error('Erreur lors de la soumission du quiz')
    } finally {
      submitting.value = false
    }
  }

  function resetQuiz() {
    state.value = 'intro'
    questions.value = []
    answers.value = []
    currentIndex.value = 0
    results.value = null
    timeRemaining.value = 0
  }

  return {
    state, loading, submitting, questions, answers, currentIndex,
    timeLimit, timeRemaining, currentQuestion, progressPercent, results,
    startQuiz, selectOption, toggleOption, previousQuestion, nextQuestion,
    goToQuestion, submitQuiz, resetQuiz
  }
}
