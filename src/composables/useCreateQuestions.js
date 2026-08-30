import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import evaluationService from '@/services/evaluation'
import klassciService from '@/services/klassci'
import { toast } from '@/services/toast'

/**
 * Couche données de CreateQuestions (H1 ≤300) : chargement de l'évaluation
 * KLASSCI (avec repli dashboard) et de l'évaluation LMS existante en mode édition,
 * gestion des questions/options/réponses, et enregistrement (création+publication
 * ou mise à jour). Comportement, services, routes, logs et alertes identiques.
 */
export function useCreateQuestions() {
  const router = useRouter()
  const route = useRoute()

  const evaluationKlassci = ref(null)
  const evaluationLMS = ref(null) // Évaluation LMS existante (pour édition)
  const configuration = reactive({
    duree_minutes: 60,
    max_attempts: 1,
    shuffle_questions: false,
    show_results: false
  })
  const questions = ref([])
  const loading = ref(false)
  const isEditMode = ref(false)

  const isValid = computed(() => {
    return configuration.duree_minutes > 0 && questions.value.length > 0
  })

  async function loadEvaluationKlassci(klassciId) {
    try {
      const result = await klassciService.getEvaluations()
      if (result.success && result.data) {
        evaluationKlassci.value = result.data.find(e => e.id === parseInt(klassciId))

        if (!evaluationKlassci.value) {
          toast.error('Évaluation KLASSCI non trouvée')
          router.back()
        }
      }
    } catch (error) {
      console.error('Erreur chargement via /lms/evaluations, utilisation du dashboard:', error)

      // Fallback: utiliser les évaluations du dashboard enseignant
      try {
        const dashboard = await klassciService.getTeacherDashboard()
        if (dashboard && dashboard.evaluations) {
          evaluationKlassci.value = dashboard.evaluations.find(e => e.id === parseInt(klassciId))

          if (!evaluationKlassci.value) {
            toast.error('Évaluation KLASSCI non trouvée dans le dashboard')
            router.back()
          } else {
            console.log('✅ Évaluation récupérée depuis le dashboard')
          }
        } else {
          toast.error('Impossible de charger l\'évaluation')
          router.back()
        }
      } catch (dashboardError) {
        console.error('Erreur chargement depuis dashboard:', dashboardError)
        toast.error('Impossible de charger l\'évaluation')
        router.back()
      }
    }
  }

  async function loadExistingEvaluation(lmsEvaluationId) {
    try {
      console.log('📖 Chargement évaluation LMS existante:', lmsEvaluationId)
      const result = await evaluationService.getEvaluation(lmsEvaluationId)

      if (result.success && result.data) {
        evaluationLMS.value = result.data
        console.log('✅ Évaluation LMS chargée:', evaluationLMS.value)

        // Charger la configuration
        configuration.duree_minutes = evaluationLMS.value.duree_minutes || 60
        configuration.max_attempts = evaluationLMS.value.max_attempts || 1
        configuration.shuffle_questions = evaluationLMS.value.shuffle_questions || false
        configuration.show_results = evaluationLMS.value.show_results || false

        // Charger les questions existantes
        if (evaluationLMS.value.questions && evaluationLMS.value.questions.length > 0) {
          questions.value = evaluationLMS.value.questions.map(q => ({
            question: q.question,
            type: q.type,
            points: q.points || 1,
            options: q.options || [],
            correct_answers: q.correct_answers || [],
            correct_answers_text: q.type === 'reponse_courte' && q.correct_answers
              ? q.correct_answers.join(', ')
              : ''
          }))
          console.log('✅ Questions chargées:', questions.value.length)
        }
      } else {
        console.error('❌ Erreur chargement évaluation LMS')
        toast.error('Impossible de charger l\'évaluation existante')
      }
    } catch (error) {
      console.error('❌ Erreur loadExistingEvaluation:', error)
      toast.error('Erreur lors du chargement de l\'évaluation')
    }
  }

  function addQuestion() {
    questions.value.push({
      question: '',
      type: 'qcm',
      points: 1.00,
      options: ['', '', '', ''],
      correct_answers: [],
      correct_answers_text: ''
    })
  }

  function removeQuestion(index) {
    questions.value.splice(index, 1)
  }

  function addOption(questionIndex) {
    questions.value[questionIndex].options.push('')
  }

  function removeOption(questionIndex, optionIndex) {
    questions.value[questionIndex].options.splice(optionIndex, 1)
  }

  function setCorrectAnswer(questionIndex, answer) {
    questions.value[questionIndex].correct_answers = [answer]
  }

  function toggleCorrectAnswer(questionIndex, answer) {
    const question = questions.value[questionIndex]
    if (!question.correct_answers) {
      question.correct_answers = []
    }
    const index = question.correct_answers.indexOf(answer)
    if (index > -1) {
      question.correct_answers.splice(index, 1)
    } else {
      question.correct_answers.push(answer)
    }
  }

  function prepareQuestionsForSubmit() {
    return questions.value.map(q => {
      const question = {
        question: q.question,
        type: q.type,
        points: q.points,
        options: null,
        correct_answers: null
      }

      if (q.type === 'qcm' || q.type === 'qcm_multiple' || q.type === 'vrai_faux') {
        question.options = q.options.filter(o => o.trim() !== '')
        question.correct_answers = q.correct_answers || []
      } else if (q.type === 'reponse_courte' && q.correct_answers_text) {
        question.correct_answers = q.correct_answers_text.split(',').map(a => a.trim())
      }

      return question
    })
  }

  async function saveQuestions() {
    if (!isValid.value) {
      toast.warning('Veuillez ajouter au moins une question')
      return
    }

    loading.value = true
    try {
      if (isEditMode.value && evaluationLMS.value) {
        // Mode édition : mettre à jour l'évaluation existante
        await updateEvaluation()
      } else {
        // Mode création : créer une nouvelle évaluation
        await createEvaluation()
      }
    } catch (error) {
      console.error('Erreur saveQuestions:', error)
      toast.error('Erreur lors de l\'enregistrement des questions')
    } finally {
      loading.value = false
    }
  }

  async function createEvaluation() {
    const data = {
      klassci_evaluation_id: evaluationKlassci.value.id,
      klassci_matiere_id: evaluationKlassci.value.matiere?.id || evaluationKlassci.value.matiere_id,
      klassci_classe_id: evaluationKlassci.value.classe?.id || evaluationKlassci.value.classe_id,
      titre: evaluationKlassci.value.titre,
      description: evaluationKlassci.value.description || '',
      type: 'qcm',
      date_evaluation: evaluationKlassci.value.date_evaluation || evaluationKlassci.value.programmation?.date_evaluation,
      duree_minutes: configuration.duree_minutes,
      coefficient: evaluationKlassci.value.coefficient || evaluationKlassci.value.programmation?.coefficient || 1,
      bareme: evaluationKlassci.value.bareme || evaluationKlassci.value.programmation?.bareme || 20,
      shuffle_questions: configuration.shuffle_questions,
      show_results: configuration.show_results,
      max_attempts: configuration.max_attempts,
      status: 'planifiee',
      questions: prepareQuestionsForSubmit()
    }

    console.log('📤 Création nouvelle évaluation:', data)

    const result = await evaluationService.createEvaluation(data)

    if (result.success) {
      // Publier immédiatement
      await evaluationService.publishEvaluation(result.data.id)

      toast.success('Questions enregistrées et évaluation activée avec succès !')
      router.push('/teacher/evaluations')
    }
  }

  async function updateEvaluation() {
    // Supprimer les questions existantes et les recréer
    // (Méthode simple : on met à jour l'évaluation avec les nouvelles questions)
    const data = {
      duree_minutes: configuration.duree_minutes,
      max_attempts: configuration.max_attempts,
      shuffle_questions: configuration.shuffle_questions,
      show_results: configuration.show_results,
      questions: prepareQuestionsForSubmit()
    }

    console.log('📤 Mise à jour évaluation:', evaluationLMS.value.id, data)

    const result = await evaluationService.updateEvaluation(evaluationLMS.value.id, data)

    if (result.success) {
      toast.success('Évaluation mise à jour avec succès !')
      router.push('/teacher/evaluations')
    }
  }

  const goBack = () => router.back()

  onMounted(async () => {
    const klassciId = route.query.klassci_id
    if (!klassciId) {
      toast.error('ID évaluation KLASSCI manquant')
      router.back()
      return
    }

    // Vérifier si mode édition (route avec paramètre :id)
    const lmsEvaluationId = route.params.id
    isEditMode.value = !!lmsEvaluationId

    await loadEvaluationKlassci(klassciId)

    // Si mode édition, charger l'évaluation LMS existante
    if (isEditMode.value) {
      await loadExistingEvaluation(lmsEvaluationId)
    }
  })

  return {
    evaluationKlassci, configuration, questions, loading, isEditMode,
    isValid,
    addQuestion, removeQuestion, addOption, removeOption,
    setCorrectAnswer, toggleCorrectAnswer,
    saveQuestions, goBack,
  }
}
