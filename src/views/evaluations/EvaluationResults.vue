<template>
  <DashboardLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
        <p class="text-secondary mt-4">Chargement de vos résultats...</p>
      </div>

      <!-- Résultats chargés -->
      <div v-else-if="submission">
        <!-- En-tête avec score -->
        <div class="bg-card rounded-lg shadow-md p-6 mb-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h1 class="text-2xl font-bold text-primary">{{ submission.evaluation.titre }}</h1>
              <p class="text-secondary text-sm mt-1">Évaluation terminée le {{ formatDate(submission.submitted_at) }}</p>
            </div>
            <button
              @click="$router.back()"
              class="px-4 py-2 text-secondary hover:text-primary flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Retour
            </button>
          </div>

          <!-- Score principal -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div class="score-card score-card-note">
              <p class="score-label">Note finale</p>
              <p class="score-value">{{ submission.note_sur_20 }}/20</p>
            </div>
            <div class="score-card score-card-score">
              <p class="score-label">Score obtenu</p>
              <p class="score-value">{{ submission.score }}</p>
              <p class="score-sublabel">points</p>
            </div>
            <div class="score-card score-card-coef">
              <p class="score-label">Coefficient</p>
              <p class="score-value">{{ submission.evaluation.coefficient }}</p>
            </div>
          </div>

          <!-- Feedback enseignant -->
          <div v-if="submission.feedback" class="feedback-card">
            <p class="feedback-title">📝 Commentaire de l'enseignant</p>
            <p class="feedback-text">{{ submission.feedback }}</p>
          </div>
        </div>

        <!-- Alerte : Correction non encore disponible -->
        <div v-if="!isCorrectionAvailable" class="countdown-alert">
          <div class="flex items-start gap-3">
            <!-- Icône horloge -->
            <div class="flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>

            <div class="flex-1">
              <h3 class="countdown-title">Correction complète en cours de préparation</h3>

              <!-- Compte à rebours visuel -->
              <div class="flex items-center gap-2 mb-3">
                <div class="countdown-badge">
                  <div class="countdown-number">{{ daysUntilCorrection }}</div>
                  <div class="countdown-label">{{ daysUntilCorrection > 1 ? 'JOURS' : 'JOUR' }}</div>
                </div>
                <div class="flex-1">
                  <p class="countdown-subtitle">Avant accès à la correction complète</p>
                  <!-- Barre de progression -->
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      :style="{ width: correctionProgressPercent + '%' }"
                    ></div>
                  </div>
                  <p class="countdown-percent">{{ correctionProgressPercent }}% du délai écoulé</p>
                </div>
              </div>

              <p class="countdown-info">
                ● Les bonnes réponses seront affichées <strong>{{ formatCorrectionDate }}</strong> (7 jours après la soumission) pour préserver l'intégrité des futures sessions.
              </p>
              <p class="countdown-note">
                Vous pouvez consulter vos réponses et votre note, mais les corrections détaillées ne sont pas encore visibles.
              </p>
            </div>
          </div>
        </div>

        <!-- Questions avec correction -->
        <div class="space-y-6">
          <h2 class="text-xl font-bold text-primary">Détails des réponses</h2>

          <div
            v-for="(question, index) in submission.questions"
            :key="question.id"
            class="bg-card rounded-lg shadow-md p-6"
          >
            <!-- En-tête de question -->
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Question {{ index + 1 }}
                  </span>
                  <span class="text-secondary text-sm">{{ question.points }} point(s)</span>
                  <span
                    v-if="isCorrectionAvailable"
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium',
                      isCorrect(question) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ isCorrect(question) ? '✓ Correct' : '✗ Incorrect' }}
                  </span>
                  <span
                    v-else
                    class="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary"
                  >
                    ● En attente de correction
                  </span>
                </div>
                <p class="text-lg text-primary">{{ question.question }}</p>
              </div>
            </div>

            <!-- QCM Simple -->
            <div v-if="question.type === 'qcm'" class="space-y-2">
              <div
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                :class="[
                  'p-3 rounded-lg border-2 transition',
                  getOptionClass(question, optIndex)
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      getOptionBorderClass(question, optIndex)
                    ]"
                  >
                    <div
                      v-if="isOptionSelected(question, optIndex) || isOptionCorrect(question, optIndex)"
                      :class="[
                        'w-3 h-3 rounded-full',
                        getOptionDotClass(question, optIndex)
                      ]"
                    ></div>
                  </div>
                  <span class="flex-1 option-text">{{ option }}</span>
                  <template v-if="isCorrectionAvailable">
                    <span v-if="isOptionCorrect(question, optIndex)" class="text-green-600 text-sm font-medium">
                      ✓ Bonne réponse
                    </span>
                    <span v-else-if="isOptionSelected(question, optIndex)" class="text-red-600 text-sm font-medium">
                      ✗ Votre réponse
                    </span>
                  </template>
                  <template v-else>
                    <span v-if="isOptionSelected(question, optIndex)" class="text-blue-600 text-sm font-medium">
                      ◆ Votre choix
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <!-- QCM Multiple -->
            <div v-else-if="question.type === 'qcm_multiple'" class="space-y-2">
              <div
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                :class="[
                  'p-3 rounded-lg border-2 transition',
                  getOptionClass(question, optIndex)
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      getOptionBorderClass(question, optIndex)
                    ]"
                  >
                    <svg
                      v-if="isOptionSelected(question, optIndex) || isOptionCorrect(question, optIndex)"
                      :class="[
                        'w-4 h-4',
                        getOptionCheckClass(question, optIndex)
                      ]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <span class="flex-1 option-text">{{ option }}</span>
                  <template v-if="isCorrectionAvailable">
                    <span v-if="isOptionCorrect(question, optIndex)" class="text-green-600 text-sm font-medium">
                      ✓ Bonne réponse
                    </span>
                    <span v-else-if="isOptionSelected(question, optIndex)" class="text-red-600 text-sm font-medium">
                      ✗ Votre réponse
                    </span>
                  </template>
                  <template v-else>
                    <span v-if="isOptionSelected(question, optIndex)" class="text-blue-600 text-sm font-medium">
                      ◆ Votre choix
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Vrai/Faux -->
            <div v-else-if="question.type === 'vrai_faux'" class="space-y-2">
              <div
                v-for="option in ['Vrai', 'Faux']"
                :key="option"
                :class="[
                  'p-3 rounded-lg border-2 transition',
                  getVraiFauxClass(question, option)
                ]"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      getVraiFauxBorderClass(question, option)
                    ]"
                  >
                    <div
                      v-if="isVraiFauxSelected(question, option) || isVraiFauxCorrect(question, option)"
                      :class="[
                        'w-3 h-3 rounded-full',
                        getVraiFauxDotClass(question, option)
                      ]"
                    ></div>
                  </div>
                  <span class="flex-1 font-medium option-text">{{ option }}</span>
                  <template v-if="isCorrectionAvailable">
                    <span v-if="isVraiFauxCorrect(question, option)" class="text-green-600 text-sm font-medium">
                      ✓ Bonne réponse
                    </span>
                    <span v-else-if="isVraiFauxSelected(question, option)" class="text-red-600 text-sm font-medium">
                      ✗ Votre réponse
                    </span>
                  </template>
                  <template v-else>
                    <span v-if="isVraiFauxSelected(question, option)" class="text-blue-600 text-sm font-medium">
                      ◆ Votre choix
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Réponse courte -->
            <div v-else-if="question.type === 'reponse_courte'">
              <div class="space-y-3">
                <div class="p-3 bg-tertiary rounded-lg border border-gray-200">
                  <p class="text-sm text-secondary mb-1">Votre réponse :</p>
                  <p class="text-primary">{{ getStudentAnswer(question) || 'Aucune réponse' }}</p>
                </div>
                <div v-if="isCorrectionAvailable && question.correct_answers && question.correct_answers.length > 0" class="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p class="text-sm text-green-800 mb-1">Réponse(s) attendue(s) :</p>
                  <ul class="list-disc list-inside text-green-900">
                    <li v-for="(answer, idx) in question.correct_answers" :key="idx">{{ answer }}</li>
                  </ul>
                </div>
                <div v-else-if="!isCorrectionAvailable" class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p class="text-sm text-yellow-800">
                    ● La correction sera disponible dans {{ daysUntilCorrection }} jour(s)
                  </p>
                </div>
              </div>
            </div>

            <!-- Dissertation -->
            <div v-else-if="question.type === 'dissertation'">
              <div class="p-3 bg-tertiary rounded-lg border border-gray-200">
                <p class="text-sm text-secondary mb-2">Votre réponse :</p>
                <p class="text-primary whitespace-pre-wrap">{{ getStudentAnswer(question) || 'Aucune réponse' }}</p>
              </div>
            </div>

            <!-- Explication (si disponible ET correction disponible) -->
            <div v-if="isCorrectionAvailable && question.explanation" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p class="text-sm font-medium text-blue-900 mb-1">
                <svg class="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                Explication
              </p>
              <p class="text-blue-800 text-sm">{{ question.explanation }}</p>
            </div>
          </div>
        </div>

        <!-- Bouton retour en bas -->
        <div class="mt-8 text-center">
          <button
            @click="$router.back()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Retour à mes évaluations
          </button>
        </div>
      </div>

      <!-- Erreur -->
      <div v-else class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-700 text-lg">{{ error || 'Impossible de charger vos résultats' }}</p>
        <button
          @click="$router.back()"
          class="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
        >
          Retour
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import api from '@/services/api'

export default {
  name: 'EvaluationResults',
  components: {
    DashboardLayout
  },
  data() {
    return {
      submission: null,
      loading: true,
      error: null,
      CORRECTION_DELAY_DAYS: 7 // Délai en jours avant d'afficher les bonnes réponses
    }
  },

  computed: {
    // Calculer si la correction complète est disponible (7 jours après soumission)
    isCorrectionAvailable() {
      if (!this.submission || !this.submission.submitted_at) return false

      const submittedDate = new Date(this.submission.submitted_at)
      const now = new Date()
      const daysSinceSubmission = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24))

      return daysSinceSubmission >= this.CORRECTION_DELAY_DAYS
    },

    // Nombre de jours restants avant correction
    daysUntilCorrection() {
      if (!this.submission || !this.submission.submitted_at) return 0

      const submittedDate = new Date(this.submission.submitted_at)
      const now = new Date()
      const daysSinceSubmission = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24))

      return Math.max(0, this.CORRECTION_DELAY_DAYS - daysSinceSubmission)
    },

    // Pourcentage de progression vers la correction
    correctionProgressPercent() {
      if (!this.submission || !this.submission.submitted_at) return 0

      const submittedDate = new Date(this.submission.submitted_at)
      const now = new Date()
      const daysSinceSubmission = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24))

      const percent = Math.min(100, Math.floor((daysSinceSubmission / this.CORRECTION_DELAY_DAYS) * 100))
      return percent
    },

    // Date à laquelle la correction sera disponible
    formatCorrectionDate() {
      if (!this.submission || !this.submission.submitted_at) return ''

      const submittedDate = new Date(this.submission.submitted_at)
      const correctionDate = new Date(submittedDate)
      correctionDate.setDate(correctionDate.getDate() + this.CORRECTION_DELAY_DAYS)

      return correctionDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },

  mounted() {
    this.loadResults()
  },

  methods: {
    async loadResults() {
      try {
        const evaluationId = this.$route.params.id
        const result = await api.get(`/evaluations/${evaluationId}/my-submission`)

        if (result.success) {
          this.submission = result.data
        } else {
          this.error = result.message || 'Résultats non disponibles'
        }
      } catch (error) {
        console.error('Erreur chargement résultats:', error)
        this.error = 'Impossible de charger vos résultats'
      } finally {
        this.loading = false
      }
    },

    formatDate(date) {
      if (!date) return 'Non disponible'
      const d = new Date(date)
      return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getStudentAnswer(question) {
      const answers = this.submission.answers || {}
      return answers[question.id]
    },

    isCorrect(question) {
      const studentAnswer = this.getStudentAnswer(question)
      const correctAnswers = question.correct_answers || []

      if (question.type === 'qcm') {
        return studentAnswer === correctAnswers[0]
      } else if (question.type === 'qcm_multiple') {
        if (!Array.isArray(studentAnswer)) return false
        return JSON.stringify([...studentAnswer].sort()) === JSON.stringify([...correctAnswers].sort())
      } else if (question.type === 'vrai_faux') {
        return studentAnswer === correctAnswers[0]
      }

      return false // Pour réponse courte/dissertation, correction manuelle
    },

    isOptionSelected(question, optionIndex) {
      const studentAnswer = this.getStudentAnswer(question)
      const options = question.options || []
      const optionText = options[optionIndex]

      if (question.type === 'qcm_multiple') {
        // Pour QCM multiple, vérifier si la réponse inclut l'index OU le texte
        return Array.isArray(studentAnswer) && (studentAnswer.includes(optionIndex) || studentAnswer.includes(optionText))
      }
      // Pour QCM simple, comparer avec l'index OU le texte
      return studentAnswer === optionIndex || studentAnswer === optionText
    },

    isOptionCorrect(question, optionIndex) {
      const correctAnswers = question.correct_answers || []
      const options = question.options || []
      const optionText = options[optionIndex]

      if (question.type === 'qcm_multiple') {
        // Pour QCM multiple, correct_answers peut contenir des indices OU des textes
        return correctAnswers.includes(optionIndex) || correctAnswers.includes(optionText)
      }
      // Pour QCM simple, correct_answers[0] peut être un indice OU un texte
      return correctAnswers[0] === optionIndex || correctAnswers[0] === optionText
    },

    getOptionClass(question, optionIndex) {
      if (!this.isCorrectionAvailable) {
        // Si correction non disponible, afficher juste la sélection de l'étudiant
        const isSelected = this.isOptionSelected(question, optionIndex)
        return isSelected ? 'option-selected-waiting' : 'option-not-selected-waiting'
      }

      const isSelected = this.isOptionSelected(question, optionIndex)
      const isCorrect = this.isOptionCorrect(question, optionIndex)

      if (isCorrect) return 'option-correct'
      if (isSelected && !isCorrect) return 'option-incorrect'
      return 'option-neutral'
    },

    getOptionBorderClass(question, optionIndex) {
      if (!this.isCorrectionAvailable) {
        const isSelected = this.isOptionSelected(question, optionIndex)
        return isSelected ? 'border-blue-400' : 'border-gray-300'
      }

      const isSelected = this.isOptionSelected(question, optionIndex)
      const isCorrect = this.isOptionCorrect(question, optionIndex)

      if (isCorrect) return 'border-green-500'
      if (isSelected && !isCorrect) return 'border-red-500'
      return 'border-gray-300'
    },

    getOptionDotClass(question, optionIndex) {
      if (!this.isCorrectionAvailable) {
        return 'bg-blue-500'
      }
      const isCorrect = this.isOptionCorrect(question, optionIndex)
      return isCorrect ? 'bg-green-500' : 'bg-red-500'
    },

    getOptionCheckClass(question, optionIndex) {
      if (!this.isCorrectionAvailable) {
        return 'text-blue-600'
      }
      const isCorrect = this.isOptionCorrect(question, optionIndex)
      return isCorrect ? 'text-green-600' : 'text-red-600'
    },

    // Vrai/Faux
    isVraiFauxSelected(question, option) {
      const studentAnswer = this.getStudentAnswer(question)
      return studentAnswer === option
    },

    isVraiFauxCorrect(question, option) {
      const correctAnswers = question.correct_answers || []
      return correctAnswers[0] === option
    },

    getVraiFauxClass(question, option) {
      if (!this.isCorrectionAvailable) {
        const isSelected = this.isVraiFauxSelected(question, option)
        return isSelected ? 'option-selected-waiting' : 'option-not-selected-waiting'
      }

      const isSelected = this.isVraiFauxSelected(question, option)
      const isCorrect = this.isVraiFauxCorrect(question, option)

      if (isCorrect) return 'option-correct'
      if (isSelected && !isCorrect) return 'option-incorrect'
      return 'option-neutral'
    },

    getVraiFauxBorderClass(question, option) {
      if (!this.isCorrectionAvailable) {
        const isSelected = this.isVraiFauxSelected(question, option)
        return isSelected ? 'border-blue-400' : 'border-gray-300'
      }

      const isSelected = this.isVraiFauxSelected(question, option)
      const isCorrect = this.isVraiFauxCorrect(question, option)

      if (isCorrect) return 'border-green-500'
      if (isSelected && !isCorrect) return 'border-red-500'
      return 'border-gray-300'
    },

    getVraiFauxDotClass(question, option) {
      if (!this.isCorrectionAvailable) {
        return 'bg-blue-500'
      }
      const isCorrect = this.isVraiFauxCorrect(question, option)
      return isCorrect ? 'bg-green-500' : 'bg-red-500'
    }
  }
}
</script>

<style scoped>
/* Adapter les cartes au thème */
.bg-card {
  background-color: var(--card-bg) !important;
}

.shadow-md {
  box-shadow: var(--card-shadow) !important;
}

.text-primary {
  color: var(--text-primary) !important;
}

.text-secondary {
  color: var(--text-secondary) !important;
}

.text-tertiary {
  color: var(--text-tertiary) !important;
}

.bg-secondary {
  background-color: var(--bg-secondary) !important;
}

.bg-tertiary {
  background-color: var(--bg-tertiary) !important;
}

.bg-hover {
  background-color: var(--bg-hover) !important;
}

.border-gray-200 {
  border-color: var(--border-primary) !important;
}

/* Cartes de score */
.score-card {
  background-color: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
}

.score-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.score-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.score-sublabel {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Carte de feedback */
.feedback-card {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
}

.feedback-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.feedback-text {
  color: var(--text-secondary);
}

/* Alerte de compte à rebours */
.countdown-alert {
  background-color: var(--bg-tertiary);
  border-left: 4px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--card-shadow);
}

.countdown-alert svg {
  color: #f59e0b;
}

.countdown-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.countdown-badge {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  padding: 1rem;
  text-align: center;
  border: 2px solid #fbbf24;
}

.countdown-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f59e0b;
}

.countdown-label {
  font-size: 0.75rem;
  color: #d97706;
  font-weight: 600;
}

.countdown-subtitle {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.progress-bar-bg {
  width: 100%;
  background-color: var(--bg-secondary);
  border-radius: 9999px;
  height: 0.5rem;
  overflow: hidden;
}

.progress-bar-fill {
  background-color: #f59e0b;
  height: 0.5rem;
  border-radius: 9999px;
  transition: all 0.5s;
}

.countdown-percent {
  font-size: 0.75rem;
  color: #d97706;
  margin-top: 0.25rem;
}

.countdown-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.countdown-note {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Classes personnalisées pour les options - période d'attente (pas de correction) */
.option-selected-waiting {
  background-color: var(--bg-tertiary) !important;
  border: 2px solid #60a5fa !important;
  border-radius: 0.5rem;
}

.option-not-selected-waiting {
  background-color: var(--bg-secondary) !important;
  border: 2px solid var(--border-primary) !important;
  border-radius: 0.5rem;
}

/* Classes personnalisées pour les options - avec correction */
.option-correct {
  background-color: rgba(34, 197, 94, 0.15) !important;
  border: 2px solid #22c55e !important;
  border-radius: 0.5rem;
}

.option-incorrect {
  background-color: rgba(239, 68, 68, 0.15) !important;
  border: 2px solid #ef4444 !important;
  border-radius: 0.5rem;
}

.option-neutral {
  background-color: var(--bg-secondary) !important;
  border: 2px solid var(--border-primary) !important;
  border-radius: 0.5rem;
}

/* Assurer que le texte des options est toujours visible */
.option-text {
  color: var(--text-primary) !important;
  font-size: 0.95rem;
  line-height: 1.5;
  font-weight: 500;
}

/* Texte dans option sélectionnée (attente) */
.option-selected-waiting .option-text {
  color: #60a5fa !important;
}

/* Texte dans option non sélectionnée */
.option-not-selected-waiting .option-text {
  color: var(--text-secondary) !important;
}

/* Texte dans bonnes réponses */
.option-correct .option-text {
  color: #22c55e !important;
}

/* Texte dans mauvaises réponses */
.option-incorrect .option-text {
  color: #ef4444 !important;
}

/* Texte dans options neutres */
.option-neutral .option-text {
  color: var(--text-secondary) !important;
}
</style>
