import { reactive, ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import evaluationService from '@/services/evaluation'
import klassciService from '@/services/klassci'

/**
 * Couche données de CreateEvaluation (H1 ≤300) : état du formulaire, chargement
 * KLASSCI (matières/classes + pré-remplissage depuis l'évaluation KLASSCI),
 * gestion des questions/options/réponses, et sauvegarde (brouillon/publication).
 * Comportement, services, routes et alertes strictement identiques à l'original.
 */
export function useCreateEvaluation() {
  // Pont route/router double source : proxy.$route (tests de vue + prod) ; useRoute()
  // (tests de composable mockant vue-router) ; repli sûr. Voir specs decomposition-300.
  const inst = getCurrentInstance()
  const route = inst?.proxy?.$route ?? useRoute() ?? { params: {}, query: {} }
  const router = inst?.proxy?.$router ?? useRouter()

  const evaluation = reactive({
    klassci_evaluation_id: null,
    klassci_matiere_id: '',
    klassci_classe_id: '',
    titre: '',
    description: '',
    type: 'qcm',
    date_evaluation: '',
    duree_minutes: 60,
    coefficient: 1.00,
    bareme: 20.00,
    shuffle_questions: false,
    show_results: false,
    allow_retake: false,
    max_attempts: 1,
    status: 'brouillon'
  })
  const evaluationKlassci = ref(null)
  const questions = ref([])
  const matieres = ref([])
  const classes = ref([])
  const loading = ref(false)

  const isValid = computed(() =>
    evaluation.klassci_matiere_id &&
    evaluation.klassci_classe_id &&
    evaluation.titre &&
    evaluation.duree_minutes > 0 &&
    questions.value.length > 0
  )

  async function loadKlassciData() {
    try {
      // Charger les matières et classes depuis KLASSCI
      const [matieresRes, classesRes] = await Promise.all([
        klassciService.getMatieres(),
        klassciService.getClasses()
      ])

      if (matieresRes.success) {
        matieres.value = matieresRes.data
      }

      if (classesRes.success) {
        classes.value = classesRes.data
      }
    } catch (error) {
      console.error('Erreur chargement données KLASSCI:', error)
      alert('Impossible de charger les données. Veuillez réessayer.')
    }
  }

  async function loadKlassciEvaluation() {
    if (!evaluation.klassci_evaluation_id) return

    try {
      // Charger toutes les évaluations et trouver celle qui correspond
      const result = await klassciService.getEvaluations()
      if (result.success && result.data) {
        evaluationKlassci.value = result.data.find(
          e => e.id === evaluation.klassci_evaluation_id
        )

        if (evaluationKlassci.value) {
          // Pré-remplir avec les données KLASSCI
          evaluation.titre = evaluationKlassci.value.titre
          evaluation.description = evaluationKlassci.value.description || ''
          evaluation.date_evaluation = evaluationKlassci.value.date_evaluation
          evaluation.coefficient = evaluationKlassci.value.coefficient || 1
          evaluation.bareme = evaluationKlassci.value.bareme || 20
        }
      }
    } catch (error) {
      console.error('Erreur chargement évaluation KLASSCI:', error)
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

  async function saveAsDraft() {
    evaluation.status = 'brouillon'
    await saveEvaluation()
  }

  async function saveAndPublish() {
    evaluation.status = 'planifiee'
    const result = await saveEvaluation()
    if (result) {
      try {
        await evaluationService.publishEvaluation(result.data.id)
      } catch (error) {
        console.error('Erreur publication:', error)
      }
    }
  }

  async function saveEvaluation() {
    if (!isValid.value) {
      alert('Veuillez remplir tous les champs requis')
      return
    }

    loading.value = true
    try {
      const data = {
        ...evaluation,
        questions: prepareQuestionsForSubmit()
      }

      const result = await evaluationService.createEvaluation(data)

      if (result.success) {
        alert('Évaluation créée avec succès !')
        router.push('/teacher/dashboard')
        return result
      }
    } catch (error) {
      console.error('Erreur création évaluation:', error)
      alert('Erreur lors de la création de l\'évaluation')
    } finally {
      loading.value = false
    }
  }

  const goBack = () => router.back()

  onMounted(async () => {
    await loadKlassciData()

    // Pré-remplir depuis les paramètres URL (évaluation KLASSCI)
    const { klassci_id, matiere_id, classe_id } = route.query
    if (klassci_id) {
      evaluation.klassci_evaluation_id = parseInt(klassci_id)
      await loadKlassciEvaluation()
    }
    if (matiere_id) {
      evaluation.klassci_matiere_id = parseInt(matiere_id)
    }
    if (classe_id) {
      evaluation.klassci_classe_id = parseInt(classe_id)
    }
  })

  return {
    evaluation, evaluationKlassci, questions, matieres, classes, loading,
    isValid,
    addQuestion, removeQuestion, addOption, removeOption,
    setCorrectAnswer, toggleCorrectAnswer,
    saveAsDraft, saveAndPublish, goBack,
  }
}
