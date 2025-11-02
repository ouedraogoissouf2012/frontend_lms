<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <div class="max-w-5xl mx-auto">
      <!-- En-tête -->
      <div class="mb-8">
        <button
          @click="$router.back()"
          class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 flex items-center gap-2 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Retour
        </button>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ isEditMode ? 'Modifier les questions QCM' : 'Créer les questions QCM' }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          {{ isEditMode ? 'Modifiez les questions de l\'évaluation en ligne' : 'Ajoutez les questions pour l\'évaluation en ligne' }}
        </p>

        <!-- Infos évaluation KLASSCI -->
        <div v-if="evaluationKlassci" class="mt-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">Évaluation</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ evaluationKlassci.titre }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">Matière</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ evaluationKlassci.matiere?.nom || evaluationKlassci.matiere?.name }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">Classe</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ evaluationKlassci.classe?.nom || evaluationKlassci.classe?.name || evaluationKlassci.classe?.libelle }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">Barème</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ evaluationKlassci.bareme || evaluationKlassci.programmation?.bareme || 20 }}/20</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700">
        <!-- Configuration -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuration</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durée (minutes) *
              </label>
              <input
                v-model.number="configuration.duree_minutes"
                type="number"
                min="1"
                class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tentatives autorisées
              </label>
              <input
                v-model.number="configuration.max_attempts"
                type="number"
                min="1"
                max="5"
                class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
          </div>

          <div class="mt-4 space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="configuration.shuffle_questions"
                type="checkbox"
                class="rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Mélanger les questions</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="configuration.show_results"
                type="checkbox"
                class="rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Afficher les résultats immédiatement</span>
            </label>
          </div>
        </div>

        <!-- Questions -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Questions QCM</h2>
            <button
              @click="addQuestion"
              type="button"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Ajouter une question
            </button>
          </div>

          <!-- Liste des questions -->
          <div class="space-y-4">
            <div
              v-for="(question, index) in questions"
              :key="index"
              class="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <div class="flex justify-between items-start mb-4">
                <h3 class="font-medium text-gray-900 dark:text-white">Question {{ index + 1 }}</h3>
                <button
                  @click="removeQuestion(index)"
                  type="button"
                  class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>

              <!-- Énoncé -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Énoncé de la question *
                </label>
                <textarea
                  v-model="question.question"
                  rows="2"
                  class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Écrivez votre question..."
                  required
                ></textarea>
              </div>

              <!-- Type de question -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de question
                </label>
                <select
                  v-model="question.type"
                  class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="qcm">QCM (Choix unique)</option>
                  <option value="qcm_multiple">QCM (Choix multiples)</option>
                  <option value="vrai_faux">Vrai/Faux</option>
                  <option value="reponse_courte">Réponse courte</option>
                </select>
              </div>

              <!-- Points -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Points
                </label>
                <input
                  v-model.number="question.points"
                  type="number"
                  step="0.5"
                  min="0"
                  class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
              </div>

              <!-- Options pour QCM -->
              <div v-if="question.type === 'qcm' || question.type === 'qcm_multiple' || question.type === 'vrai_faux'">
                <div class="mb-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Options de réponse
                  </label>
                  <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    <span v-if="question.type === 'qcm'">
                      ⓘ Cochez UNE seule bonne réponse (choix unique)
                    </span>
                    <span v-else-if="question.type === 'qcm_multiple'">
                      ⓘ Cochez TOUTES les bonnes réponses (choix multiples)
                    </span>
                    <span v-else>
                      ⓘ Cochez la bonne réponse (Vrai ou Faux)
                    </span>
                  </p>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="(option, optIndex) in question.options"
                    :key="optIndex"
                    :class="[
                      'flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                      (question.type === 'qcm' && question.correct_answers && question.correct_answers[0] === option) ||
                      (question.type === 'qcm_multiple' && question.correct_answers && question.correct_answers.includes(option))
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    ]"
                  >
                    <!-- Radio/Checkbox pour marquer la bonne réponse -->
                    <div class="flex items-center">
                      <input
                        v-if="question.type === 'qcm'"
                        type="radio"
                        :name="'correct-' + index"
                        :checked="question.correct_answers && question.correct_answers[0] === option"
                        @change="setCorrectAnswer(index, option)"
                        class="w-5 h-5 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                        :title="'Marquer comme bonne réponse'"
                      />
                      <input
                        v-else-if="question.type === 'qcm_multiple'"
                        type="checkbox"
                        :checked="question.correct_answers && question.correct_answers.includes(option)"
                        @change="toggleCorrectAnswer(index, option)"
                        class="w-5 h-5 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                        :title="'Marquer comme bonne réponse'"
                      />
                    </div>

                    <!-- Icône de validation si c'est la bonne réponse -->
                    <div class="flex-shrink-0">
                      <svg
                        v-if="(question.type === 'qcm' && question.correct_answers && question.correct_answers[0] === option) ||
                              (question.type === 'qcm_multiple' && question.correct_answers && question.correct_answers.includes(option))"
                        class="w-6 h-6 text-green-600 dark:text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      <span v-else class="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
                        {{ String.fromCharCode(65 + optIndex) }}
                      </span>
                    </div>

                    <!-- Champ de texte pour l'option -->
                    <input
                      v-model="question.options[optIndex]"
                      type="text"
                      class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      :placeholder="'Option ' + String.fromCharCode(65 + optIndex)"
                    />

                    <!-- Bouton supprimer -->
                    <button
                      v-if="question.options.length > 2"
                      @click="removeOption(index, optIndex)"
                      type="button"
                      class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 transition-colors"
                      title="Supprimer cette option"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  @click="addOption(index)"
                  type="button"
                  class="mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Ajouter une option
                </button>
              </div>

              <!-- Réponses courtes -->
              <div v-else-if="question.type === 'reponse_courte'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Réponse(s) acceptée(s)
                </label>
                <input
                  v-model="question.correct_answers_text"
                  type="text"
                  class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Séparez les réponses par des virgules"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ex: Paris, paris, PARIS (la casse est ignorée)
                </p>
              </div>
            </div>

            <div v-if="questions.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              Aucune question ajoutée. Cliquez sur "Ajouter une question" pour commencer.
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="saveQuestions"
            type="button"
            :disabled="loading || !isValid"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {{ loading ? 'Enregistrement...' : (isEditMode ? 'Enregistrer les modifications' : 'Enregistrer et activer') }}
          </button>
        </div>
      </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import evaluationService from '@/services/evaluation'
import klassciService from '@/services/klassci'

// Router
const router = useRouter()
const route = useRoute()

// Reactive state
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

// Computed
const isValid = computed(() => {
  return configuration.duree_minutes > 0 && questions.value.length > 0
})

// Methods
async function loadEvaluationKlassci(klassciId) {
  try {
    const result = await klassciService.getEvaluations()
    if (result.success && result.data) {
      evaluationKlassci.value = result.data.find(e => e.id === parseInt(klassciId))

      if (!evaluationKlassci.value) {
        alert('Évaluation KLASSCI non trouvée')
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
          alert('Évaluation KLASSCI non trouvée dans le dashboard')
          router.back()
        } else {
          console.log('✅ Évaluation récupérée depuis le dashboard')
        }
      } else {
        alert('Impossible de charger l\'évaluation')
        router.back()
      }
    } catch (dashboardError) {
      console.error('Erreur chargement depuis dashboard:', dashboardError)
      alert('Impossible de charger l\'évaluation')
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
      alert('Impossible de charger l\'évaluation existante')
    }
  } catch (error) {
    console.error('❌ Erreur loadExistingEvaluation:', error)
    alert('Erreur lors du chargement de l\'évaluation')
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
    alert('Veuillez ajouter au moins une question')
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
    alert('Erreur lors de l\'enregistrement des questions')
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

    alert('Questions enregistrées et évaluation activée avec succès !')
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
    alert('Évaluation mise à jour avec succès !')
    router.push('/teacher/evaluations')
  }
}

// Lifecycle
onMounted(async () => {
  const klassciId = route.query.klassci_id
  if (!klassciId) {
    alert('ID évaluation KLASSCI manquant')
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
</script>

<style scoped>
.dashboard-content {
  padding: 2rem;
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
  }
}
</style>
