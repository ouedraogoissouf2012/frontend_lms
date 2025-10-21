<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- En-tête -->
      <div class="mb-8">
        <button
          @click="$router.back()"
          class="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Retour
        </button>
        <h1 class="text-3xl font-bold text-gray-900">Créer version en ligne</h1>
        <p class="text-gray-600 mt-2">Ajoutez des questions QCM pour l'évaluation en ligne</p>
        <div v-if="evaluationKlassci" class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm font-medium text-blue-900">Évaluation KLASSCI : {{ evaluationKlassci.titre }}</p>
          <p class="text-sm text-blue-700 mt-1">
            {{ evaluationKlassci.matiere?.name }} - {{ evaluationKlassci.classe?.libelle }}
          </p>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
        <!-- Informations de base -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Matière -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Matière *
              </label>
              <select
                v-model="evaluation.klassci_matiere_id"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner une matière</option>
                <option
                  v-for="matiere in matieres"
                  :key="matiere.id"
                  :value="matiere.id"
                >
                  {{ matiere.name || matiere.nom }}
                </option>
              </select>
            </div>

            <!-- Classe -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Classe *
              </label>
              <select
                v-model="evaluation.klassci_classe_id"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner une classe</option>
                <option
                  v-for="classe in classes"
                  :key="classe.id"
                  :value="classe.id"
                >
                  {{ classe.name || classe.libelle }}
                </option>
              </select>
            </div>

            <!-- Titre -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'évaluation *
              </label>
              <input
                v-model="evaluation.titre"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Évaluation Chapitre 1 - Les bases"
                required
              />
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                v-model="evaluation.description"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description de l'évaluation..."
              ></textarea>
            </div>

            <!-- Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Date de l'évaluation
              </label>
              <input
                v-model="evaluation.date_evaluation"
                type="datetime-local"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Durée -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Durée (minutes) *
              </label>
              <input
                v-model.number="evaluation.duree_minutes"
                type="number"
                min="1"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Coefficient -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Coefficient
              </label>
              <input
                v-model.number="evaluation.coefficient"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Barème -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Barème
              </label>
              <input
                v-model.number="evaluation.bareme"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Options -->
          <div class="mt-4 space-y-2">
            <label class="flex items-center gap-2">
              <input
                v-model="evaluation.shuffle_questions"
                type="checkbox"
                class="rounded text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Mélanger les questions</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="evaluation.show_results"
                type="checkbox"
                class="rounded text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Afficher les résultats immédiatement</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="evaluation.allow_retake"
                type="checkbox"
                class="rounded text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Autoriser plusieurs tentatives</span>
            </label>
          </div>
        </div>

        <!-- Questions -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Questions</h2>
            <button
              @click="addQuestion"
              type="button"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
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
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex justify-between items-start mb-4">
                <h3 class="font-medium text-gray-900">Question {{ index + 1 }}</h3>
                <button
                  @click="removeQuestion(index)"
                  type="button"
                  class="text-red-600 hover:text-red-700"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>

              <!-- Énoncé -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Énoncé de la question *
                </label>
                <textarea
                  v-model="question.question"
                  rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Écrivez votre question..."
                  required
                ></textarea>
              </div>

              <!-- Type de question -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Type de question
                </label>
                <select
                  v-model="question.type"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="qcm">QCM (Choix unique)</option>
                  <option value="qcm_multiple">QCM (Choix multiples)</option>
                  <option value="vrai_faux">Vrai/Faux</option>
                  <option value="reponse_courte">Réponse courte</option>
                </select>
              </div>

              <!-- Points -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  v-model.number="question.points"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <!-- Options pour QCM -->
              <div v-if="question.type === 'qcm' || question.type === 'qcm_multiple' || question.type === 'vrai_faux'">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Options de réponse
                </label>
                <div class="space-y-2">
                  <div
                    v-for="(option, optIndex) in question.options"
                    :key="optIndex"
                    class="flex items-center gap-2"
                  >
                    <input
                      v-if="question.type === 'qcm'"
                      type="radio"
                      :name="'correct-' + index"
                      :checked="question.correct_answers && question.correct_answers[0] === option"
                      @change="setCorrectAnswer(index, option)"
                      class="text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      v-else-if="question.type === 'qcm_multiple'"
                      type="checkbox"
                      :checked="question.correct_answers && question.correct_answers.includes(option)"
                      @change="toggleCorrectAnswer(index, option)"
                      class="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      v-model="question.options[optIndex]"
                      type="text"
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      :placeholder="'Option ' + (optIndex + 1)"
                    />
                    <button
                      v-if="question.options.length > 2"
                      @click="removeOption(index, optIndex)"
                      type="button"
                      class="text-red-600 hover:text-red-700"
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
                  class="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Ajouter une option
                </button>
              </div>

              <!-- Réponses courtes -->
              <div v-else-if="question.type === 'reponse_courte'">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Réponse(s) acceptée(s)
                </label>
                <input
                  v-model="question.correct_answers_text"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Séparez les réponses par des virgules"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Ex: Paris, paris, PARIS (la casse est ignorée)
                </p>
              </div>
            </div>

            <div v-if="questions.length === 0" class="text-center py-8 text-gray-500">
              Aucune question ajoutée. Cliquez sur "Ajouter une question" pour commencer.
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-4 pt-6 border-t">
          <button
            @click="saveAsDraft"
            type="button"
            :disabled="loading"
            class="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            {{ loading ? 'Enregistrement...' : 'Enregistrer comme brouillon' }}
          </button>
          <button
            @click="saveAndPublish"
            type="button"
            :disabled="loading || !isValid"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            {{ loading ? 'Publication...' : 'Publier l\'évaluation' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import evaluationService from '@/services/evaluation'
import klassciService from '@/services/klassci'

export default {
  name: 'CreateEvaluation',
  data() {
    return {
      evaluation: {
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
      },
      evaluationKlassci: null,
      questions: [],
      matieres: [],
      classes: [],
      loading: false
    }
  },
  computed: {
    isValid() {
      return this.evaluation.klassci_matiere_id &&
             this.evaluation.klassci_classe_id &&
             this.evaluation.titre &&
             this.evaluation.duree_minutes > 0 &&
             this.questions.length > 0
    }
  },
  async mounted() {
    await this.loadKlassciData()

    // Pré-remplir depuis les paramètres URL (évaluation KLASSCI)
    const { klassci_id, matiere_id, classe_id } = this.$route.query
    if (klassci_id) {
      this.evaluation.klassci_evaluation_id = parseInt(klassci_id)
      await this.loadKlassciEvaluation()
    }
    if (matiere_id) {
      this.evaluation.klassci_matiere_id = parseInt(matiere_id)
    }
    if (classe_id) {
      this.evaluation.klassci_classe_id = parseInt(classe_id)
    }
  },
  methods: {
    async loadKlassciData() {
      try {
        // Charger les matières et classes depuis KLASSCI
        const [matieresRes, classesRes] = await Promise.all([
          klassciService.getMatieres(),
          klassciService.getClasses()
        ])

        if (matieresRes.success) {
          this.matieres = matieresRes.data
        }

        if (classesRes.success) {
          this.classes = classesRes.data
        }
      } catch (error) {
        console.error('Erreur chargement données KLASSCI:', error)
        alert('Impossible de charger les données. Veuillez réessayer.')
      }
    },

    async loadKlassciEvaluation() {
      if (!this.evaluation.klassci_evaluation_id) return

      try {
        // Charger toutes les évaluations et trouver celle qui correspond
        const result = await klassciService.getEvaluations()
        if (result.success && result.data) {
          this.evaluationKlassci = result.data.find(
            e => e.id === this.evaluation.klassci_evaluation_id
          )

          if (this.evaluationKlassci) {
            // Pré-remplir avec les données KLASSCI
            this.evaluation.titre = this.evaluationKlassci.titre
            this.evaluation.description = this.evaluationKlassci.description || ''
            this.evaluation.date_evaluation = this.evaluationKlassci.date_evaluation
            this.evaluation.coefficient = this.evaluationKlassci.coefficient || 1
            this.evaluation.bareme = this.evaluationKlassci.bareme || 20
          }
        }
      } catch (error) {
        console.error('Erreur chargement évaluation KLASSCI:', error)
      }
    },

    addQuestion() {
      this.questions.push({
        question: '',
        type: 'qcm',
        points: 1.00,
        options: ['', '', '', ''],
        correct_answers: [],
        correct_answers_text: ''
      })
    },

    removeQuestion(index) {
      this.questions.splice(index, 1)
    },

    addOption(questionIndex) {
      this.questions[questionIndex].options.push('')
    },

    removeOption(questionIndex, optionIndex) {
      this.questions[questionIndex].options.splice(optionIndex, 1)
    },

    setCorrectAnswer(questionIndex, answer) {
      this.questions[questionIndex].correct_answers = [answer]
    },

    toggleCorrectAnswer(questionIndex, answer) {
      const question = this.questions[questionIndex]
      if (!question.correct_answers) {
        question.correct_answers = []
      }
      const index = question.correct_answers.indexOf(answer)
      if (index > -1) {
        question.correct_answers.splice(index, 1)
      } else {
        question.correct_answers.push(answer)
      }
    },

    prepareQuestionsForSubmit() {
      return this.questions.map(q => {
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
    },

    async saveAsDraft() {
      this.evaluation.status = 'brouillon'
      await this.saveEvaluation()
    },

    async saveAndPublish() {
      this.evaluation.status = 'planifiee'
      const result = await this.saveEvaluation()
      if (result) {
        try {
          await evaluationService.publishEvaluation(result.data.id)
        } catch (error) {
          console.error('Erreur publication:', error)
        }
      }
    },

    async saveEvaluation() {
      if (!this.isValid) {
        alert('Veuillez remplir tous les champs requis')
        return
      }

      this.loading = true
      try {
        const data = {
          ...this.evaluation,
          questions: this.prepareQuestionsForSubmit()
        }

        const result = await evaluationService.createEvaluation(data)

        if (result.success) {
          alert('Évaluation créée avec succès !')
          this.$router.push('/teacher/dashboard')
          return result
        }
      } catch (error) {
        console.error('Erreur création évaluation:', error)
        alert('Erreur lors de la création de l\'évaluation')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
