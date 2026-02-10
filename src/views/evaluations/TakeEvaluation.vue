<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement de l'évaluation..." />

      <!-- Évaluation chargée -->
      <div v-else-if="evaluation">
        <!-- Alerte fermeture imminente fenêtre -->
        <div
          v-if="windowTimeLeft !== null && windowTimeLeft <= 5"
          class="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg animate-pulse"
        >
          <p class="text-red-900 font-bold text-lg">
            ⚠️ ATTENTION: La fenêtre d'évaluation va se fermer dans {{ windowTimeLeft }} minutes!
          </p>
          <p class="text-red-800 text-sm mt-1">
            Votre évaluation sera automatiquement soumise à la fermeture.
          </p>
        </div>

        <!-- Compte à rebours fenêtre temporelle -->
        <div
          v-else-if="windowTimeLeft !== null && windowTimeLeft > 0"
          class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              <p class="text-blue-900 font-medium">
                Temps restant avant fermeture de la fenêtre
              </p>
            </div>
            <p class="text-2xl font-bold text-blue-700">
              {{ formatTimeLeft(windowTimeLeft) }}
            </p>
          </div>
        </div>

        <!-- En-tête fixe -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-4 z-10">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ evaluation.titre }}</h1>
              <p class="text-gray-600 text-sm mt-1">{{ evaluation.description }}</p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold text-blue-600">{{ formatTime(timeRemaining) }}</div>
              <p class="text-sm text-gray-600">Temps restant</p>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mt-4">
            <div class="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{{ answeredCount }}/{{ evaluation.questions.length }} réponses</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Questions -->
        <div class="space-y-6">
          <div
            v-for="(question, index) in evaluation.questions"
            :key="question.id"
            class="bg-white rounded-lg shadow-md p-6"
          >
            <!-- En-tête de question -->
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Question {{ index + 1 }}
                  </span>
                  <span class="text-gray-600 text-sm">{{ question.points }} point(s)</span>
                </div>
                <p class="text-lg text-gray-900">{{ question.question }}</p>
              </div>
              <span
                v-if="answers[question.id] !== undefined && answers[question.id] !== null && answers[question.id] !== ''"
                class="text-green-600"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </span>
            </div>

            <!-- QCM Simple -->
            <div v-if="question.type === 'qcm'" class="space-y-2">
              <label
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50"
                :class="answers[question.id] === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
              >
                <input
                  type="radio"
                  :name="'question-' + question.id"
                  :value="option"
                  v-model="answers[question.id]"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-gray-900">{{ option }}</span>
              </label>
            </div>

            <!-- QCM Multiple -->
            <div v-else-if="question.type === 'qcm_multiple'" class="space-y-2">
              <label
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50"
                :class="isOptionSelected(question.id, option) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
              >
                <input
                  type="checkbox"
                  :value="option"
                  @change="toggleMultipleChoice(question.id, option)"
                  :checked="isOptionSelected(question.id, option)"
                  class="rounded text-blue-600 focus:ring-blue-500"
                />
                <span class="text-gray-900">{{ option }}</span>
              </label>
            </div>

            <!-- Vrai/Faux -->
            <div v-else-if="question.type === 'vrai_faux'" class="space-y-2">
              <label
                class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50"
                :class="answers[question.id] === 'Vrai' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
              >
                <input
                  type="radio"
                  :name="'question-' + question.id"
                  value="Vrai"
                  v-model="answers[question.id]"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-gray-900">Vrai</span>
              </label>
              <label
                class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50"
                :class="answers[question.id] === 'Faux' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
              >
                <input
                  type="radio"
                  :name="'question-' + question.id"
                  value="Faux"
                  v-model="answers[question.id]"
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-gray-900">Faux</span>
              </label>
            </div>

            <!-- Réponse courte -->
            <div v-else-if="question.type === 'reponse_courte'">
              <input
                v-model="answers[question.id]"
                type="text"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre réponse..."
              />
            </div>

            <!-- Dissertation -->
            <div v-else-if="question.type === 'dissertation'">
              <textarea
                v-model="answers[question.id]"
                rows="5"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Votre réponse..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-white rounded-lg shadow-md p-6 mt-6 sticky bottom-4">
          <div class="flex gap-4">
            <button
              @click="confirmCancel"
              class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              @click="confirmSubmit"
              :disabled="submitting"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              {{ submitting ? 'Soumission en cours...' : 'Soumettre l\'évaluation' }}
            </button>
          </div>
          <p class="text-sm text-gray-600 text-center mt-2">
            Assurez-vous d'avoir répondu à toutes les questions avant de soumettre
          </p>
        </div>
      </div>

      <!-- Erreur -->
      <div v-else class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-700 text-lg">{{ error || 'Impossible de charger l\'évaluation' }}</p>
        <button
          @click="$router.back()"
          class="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
        >
          Retour
        </button>
      </div>
    </div>

    <!-- Modal de confirmation soumission -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Confirmer la soumission</h3>
        <p class="text-gray-700 mb-6">
          Vous avez répondu à {{ answeredCount }} question(s) sur {{ evaluation.questions.length }}.
          <br><br>
          Êtes-vous sûr de vouloir soumettre votre évaluation ? Cette action est irréversible.
        </p>
        <div class="flex gap-4">
          <button
            @click="showConfirmModal = false"
            class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            @click="submitEvaluation"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>

    <!-- Modal résultats -->
    <div v-if="showResultsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Évaluation soumise !</h3>
          <p class="text-gray-600 mb-6">Votre évaluation a été soumise avec succès.</p>

          <div v-if="results" class="bg-blue-50 rounded-lg p-6 mb-6">
            <p class="text-sm text-blue-900 mb-2">Votre note</p>
            <p class="text-4xl font-bold text-blue-600">{{ results.note_sur_20 }}/20</p>
            <p class="text-sm text-blue-700 mt-2">Score: {{ results.score }} points</p>
          </div>

          <button
            @click="returnToDashboard"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import evaluationService from '@/services/evaluation'
import { auth } from '@/services/api'
import ContentLoader from '@/components/common/ContentLoader.vue'

export default {
  name: 'TakeEvaluation',
  components: {
    ContentLoader
  },
  data() {
    return {
      evaluation: null,
      answers: {},
      loading: true,
      submitting: false,
      error: null,
      user: null,
      submissionId: null,
      timeRemaining: 0,
      timer: null,
      windowTimeLeft: null,
      timeCheckInterval: null,
      showConfirmModal: false,
      showResultsModal: false,
      results: null
    }
  },
  computed: {
    answeredCount() {
      return Object.values(this.answers).filter(answer => {
        if (Array.isArray(answer)) {
          return answer.length > 0
        }
        return answer !== undefined && answer !== null && answer !== ''
      }).length
    },
    progressPercentage() {
      if (!this.evaluation || !this.evaluation.questions) return 0
      return Math.round((this.answeredCount / this.evaluation.questions.length) * 100)
    }
  },
  async mounted() {
    this.user = auth.getUser()
    if (!this.user) {
      this.$router.push('/login')
      return
    }

    this.submissionId = this.$route.query.submission_id
    if (!this.submissionId) {
      this.error = 'ID de soumission manquant'
      this.loading = false
      return
    }

    await this.loadEvaluation()
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    if (this.timeCheckInterval) {
      clearInterval(this.timeCheckInterval)
    }
  },
  methods: {
    async loadEvaluation() {
      this.loading = true
      try {
        const id = this.$route.params.id
        const result = await evaluationService.getEvaluation(id)

        if (result.success) {
          this.evaluation = result.data

          // Initialiser les réponses
          this.evaluation.questions.forEach(question => {
            if (question.type === 'qcm_multiple') {
              this.answers[question.id] = []
            } else {
              this.answers[question.id] = ''
            }
          })

          // Initialiser le temps restant fenêtre
          if (this.evaluation.programmation?.window) {
            this.windowTimeLeft = this.evaluation.programmation.window.time_left_minutes
          }

          // Démarrer le timer
          this.timeRemaining = this.evaluation.duree_minutes * 60 // en secondes
          this.startTimer()
          this.startWindowTimeTracking()
        } else {
          this.error = 'Évaluation non trouvée'
        }
      } catch (error) {
        console.error('Erreur chargement évaluation:', error)
        this.error = 'Impossible de charger l\'évaluation'
      } finally {
        this.loading = false
      }
    },

    startTimer() {
      this.timer = setInterval(() => {
        this.timeRemaining--

        if (this.timeRemaining <= 0) {
          clearInterval(this.timer)
          alert('Temps écoulé ! Votre évaluation va être soumise automatiquement.')
          this.submitEvaluation()
        }
      }, 1000)
    },

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    formatTimeLeft(minutes) {
      if (minutes === null || minutes <= 0) return '0 min'
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (hours > 0) {
        return `${hours}h ${mins.toString().padStart(2, '0')}min`
      }
      return `${mins} min`
    },

    startWindowTimeTracking() {
      // Vérifier le temps toutes les 30 secondes
      this.timeCheckInterval = setInterval(async () => {
        await this.checkWindowTimeRemaining()
      }, 30000) // 30 secondes
    },

    async checkWindowTimeRemaining() {
      try {
        const result = await evaluationService.getTimeStatus(this.evaluation.id)

        if (result.success && result.data.window) {
          const window = result.data.window
          this.windowTimeLeft = window.time_left_minutes

          // Auto-soumission si fenêtre fermée
          if (window.has_ended && !this.submitting) {
            console.warn('⏰ Fenêtre fermée - Auto-soumission')
            clearInterval(this.timeCheckInterval)
            clearInterval(this.timer)
            alert('La fenêtre d\'évaluation est fermée. Soumission automatique de vos réponses...')
            await this.submitEvaluation()
          }
        }
      } catch (error) {
        console.error('Erreur vérification temps fenêtre:', error)
      }
    },

    isOptionSelected(questionId, option) {
      return Array.isArray(this.answers[questionId]) &&
             this.answers[questionId].includes(option)
    },

    toggleMultipleChoice(questionId, option) {
      if (!Array.isArray(this.answers[questionId])) {
        this.answers[questionId] = []
      }

      const index = this.answers[questionId].indexOf(option)
      if (index > -1) {
        this.answers[questionId].splice(index, 1)
      } else {
        this.answers[questionId].push(option)
      }
    },

    confirmCancel() {
      if (confirm('Êtes-vous sûr de vouloir annuler ? Vos réponses ne seront pas sauvegardées.')) {
        this.$router.push('/student/evaluations')
      }
    },

    confirmSubmit() {
      this.showConfirmModal = true
    },

    async submitEvaluation() {
      this.showConfirmModal = false
      this.submitting = true

      try {
        // Arrêter les timers
        if (this.timer) {
          clearInterval(this.timer)
        }
        if (this.timeCheckInterval) {
          clearInterval(this.timeCheckInterval)
        }

        const result = await evaluationService.submitEvaluation(
          this.evaluation.id,
          this.submissionId,
          this.answers
        )

        if (result.success) {
          this.results = result.data

          // Afficher les résultats si configuré
          if (this.evaluation.show_results) {
            this.showResultsModal = true
          } else {
            alert('Évaluation soumise avec succès !')
            this.returnToDashboard()
          }
        }
      } catch (error) {
        console.error('Erreur soumission évaluation:', error)
        alert('Erreur lors de la soumission de l\'évaluation')
      } finally {
        this.submitting = false
      }
    },

    returnToDashboard() {
      this.$router.push('/student/evaluations')
    }
  }
}
</script>
