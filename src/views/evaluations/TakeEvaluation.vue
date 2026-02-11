<template>
  <DashboardLayout>
    <div class="take-evaluation-container">
      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement de l'évaluation..." />

      <!-- Évaluation chargée -->
      <template v-else-if="evaluation">
        <!-- Bandeau mode entraînement -->
        <div v-if="isPractice" class="practice-banner">
          <i class="fa fa-graduation-cap"></i>
          <div>
            <p class="practice-title">Mode Entraînement</p>
            <p class="practice-subtitle">Cette note ne sera pas comptabilisée dans votre moyenne.</p>
          </div>
        </div>

        <!-- Alerte fermeture imminente fenêtre -->
        <div v-if="windowTimeLeft !== null && windowTimeLeft <= 5" class="alert-urgent">
          <i class="fa fa-exclamation-triangle"></i>
          <div>
            <p class="alert-title">ATTENTION: La fenêtre d'évaluation va se fermer dans {{ windowTimeLeft }} minutes!</p>
            <p class="alert-subtitle">Votre évaluation sera automatiquement soumise à la fermeture.</p>
          </div>
        </div>

        <!-- Compte à rebours fenêtre temporelle -->
        <div v-else-if="windowTimeLeft !== null && windowTimeLeft > 0" class="alert-info">
          <div class="alert-info-row">
            <div class="alert-info-left">
              <i class="fa fa-clock-o"></i>
              <span>Temps restant avant fermeture de la fenêtre</span>
            </div>
            <span class="alert-info-time">{{ formatTimeLeft(windowTimeLeft) }}</span>
          </div>
        </div>

        <!-- En-tête sticky -->
        <div class="eval-header">
          <div class="eval-header-left">
            <h1 class="eval-title">{{ evaluation.titre }}</h1>
            <p v-if="evaluation.description" class="eval-description">{{ evaluation.description }}</p>
          </div>
          <div class="eval-timer" :class="{ 'timer-warning': timeRemaining <= 300, 'timer-danger': timeRemaining <= 60 }">
            <span class="timer-value">{{ formatTime(timeRemaining) }}</span>
            <span class="timer-label">Temps restant</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="eval-progress">
          <div class="progress-info">
            <span>Progression</span>
            <span>{{ answeredCount }}/{{ evaluation.questions.length }} réponses</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
        </div>

        <!-- Questions -->
        <div class="questions-list">
          <div
            v-for="(question, index) in evaluation.questions"
            :key="question.id"
            class="question-card"
            :class="{ 'question-answered': isAnswered(question.id) }"
          >
            <!-- En-tête de question -->
            <div class="question-header">
              <div class="question-meta">
                <span class="question-number">Question {{ index + 1 }}</span>
                <span class="question-points">{{ question.points }} point(s)</span>
              </div>
              <i v-if="isAnswered(question.id)" class="fa fa-check-circle question-check"></i>
            </div>

            <p class="question-text">{{ question.question }}</p>

            <!-- QCM Simple -->
            <div v-if="question.type === 'qcm'" class="options-list">
              <label
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                class="option-item"
                :class="{ 'option-selected': answers[question.id] === option }"
              >
                <input
                  type="radio"
                  :name="'question-' + question.id"
                  :value="option"
                  v-model="answers[question.id]"
                  class="option-input"
                />
                <span class="option-label">{{ option }}</span>
              </label>
            </div>

            <!-- QCM Multiple -->
            <div v-else-if="question.type === 'qcm_multiple'" class="options-list">
              <label
                v-for="(option, optIndex) in question.options"
                :key="optIndex"
                class="option-item"
                :class="{ 'option-selected': isOptionSelected(question.id, option) }"
              >
                <input
                  type="checkbox"
                  :value="option"
                  @change="toggleMultipleChoice(question.id, option)"
                  :checked="isOptionSelected(question.id, option)"
                  class="option-input option-checkbox"
                />
                <span class="option-label">{{ option }}</span>
              </label>
            </div>

            <!-- Vrai/Faux -->
            <div v-else-if="question.type === 'vrai_faux'" class="options-list">
              <label
                class="option-item"
                :class="{ 'option-selected': answers[question.id] === 'Vrai' }"
              >
                <input type="radio" :name="'question-' + question.id" value="Vrai" v-model="answers[question.id]" class="option-input" />
                <span class="option-label">Vrai</span>
              </label>
              <label
                class="option-item"
                :class="{ 'option-selected': answers[question.id] === 'Faux' }"
              >
                <input type="radio" :name="'question-' + question.id" value="Faux" v-model="answers[question.id]" class="option-input" />
                <span class="option-label">Faux</span>
              </label>
            </div>

            <!-- Réponse courte -->
            <div v-else-if="question.type === 'reponse_courte'">
              <input v-model="answers[question.id]" type="text" class="text-input" placeholder="Votre réponse..." />
            </div>

            <!-- Dissertation -->
            <div v-else-if="question.type === 'dissertation'">
              <textarea v-model="answers[question.id]" rows="5" class="text-input textarea-input" placeholder="Votre réponse..."></textarea>
            </div>
          </div>
        </div>

        <!-- Actions sticky -->
        <div class="eval-actions">
          <button @click="confirmCancel" class="btn-cancel">
            <i class="fa fa-times"></i>
            Annuler
          </button>
          <button @click="confirmSubmit" :disabled="submitting" class="btn-submit">
            <i :class="submitting ? 'fa fa-spinner fa-spin' : 'fa fa-paper-plane'"></i>
            {{ submitting ? 'Soumission en cours...' : (isPractice ? 'Terminer l\'entraînement' : 'Soumettre l\'évaluation') }}
          </button>
        </div>
        <p class="actions-hint">Assurez-vous d'avoir répondu à toutes les questions avant de soumettre</p>
      </template>

      <!-- Erreur -->
      <div v-else class="error-state">
        <i class="fa fa-exclamation-circle error-icon"></i>
        <p class="error-text">{{ error || 'Impossible de charger l\'évaluation' }}</p>
        <button @click="$router.back()" class="btn-back-error">
          <i class="fa fa-arrow-left"></i>
          Retour
        </button>
      </div>

      <!-- Modal de confirmation soumission -->
      <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
        <div class="modal-card">
          <h3 class="modal-title">Confirmer la soumission</h3>
          <p class="modal-text">
            Vous avez répondu à <strong>{{ answeredCount }}</strong> question(s) sur <strong>{{ evaluation.questions.length }}</strong>.
          </p>
          <p class="modal-warning" v-if="answeredCount < evaluation.questions.length">
            <i class="fa fa-exclamation-triangle"></i>
            Certaines questions n'ont pas été répondues.
          </p>
          <p class="modal-text">Êtes-vous sûr de vouloir soumettre ? Cette action est irréversible.</p>
          <div class="modal-actions">
            <button @click="showConfirmModal = false" class="btn-cancel">Annuler</button>
            <button @click="submitEvaluation" class="btn-submit">Confirmer</button>
          </div>
        </div>
      </div>

      <!-- Modal résultats -->
      <div v-if="showResultsModal" class="modal-overlay">
        <div class="modal-card modal-results">
          <div class="results-icon">
            <i class="fa fa-check-circle"></i>
          </div>
          <h3 class="modal-title">{{ isPractice ? 'Entraînement terminé !' : 'Évaluation soumise !' }}</h3>
          <p class="modal-text">{{ isPractice ? 'Votre entraînement a été complété.' : 'Votre évaluation a été soumise avec succès.' }}</p>

          <div v-if="results" class="results-score" :class="{ 'results-practice': isPractice }">
            <p class="score-label">{{ isPractice ? 'Note indicative' : 'Votre note' }}</p>
            <p class="score-value">{{ results.note_sur_20 }}<span class="score-unit">/20</span></p>
            <p class="score-detail">Score: {{ results.score }} points</p>
            <p v-if="isPractice" class="practice-note-info">Cette note n'est pas comptabilisée dans votre moyenne.</p>
          </div>

          <button @click="returnToEvaluations" class="btn-submit btn-full">
            <i class="fa fa-arrow-left"></i>
            Retour aux évaluations
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import evaluationService from '@/services/evaluation'
import { auth } from '@/services/api'
import ContentLoader from '@/components/common/ContentLoader.vue'

export default {
  name: 'TakeEvaluation',
  components: {
    DashboardLayout,
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
      results: null,
      isPractice: false
    }
  },
  computed: {
    answeredCount() {
      return Object.values(this.answers).filter(answer => {
        if (Array.isArray(answer)) return answer.length > 0
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
    this.isPractice = this.$route.query.practice === '1'
    if (!this.submissionId) {
      this.error = 'ID de soumission manquant'
      this.loading = false
      return
    }

    await this.loadEvaluation()
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer)
    if (this.timeCheckInterval) clearInterval(this.timeCheckInterval)
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
          this.timeRemaining = this.evaluation.duree_minutes * 60
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
      if (hours > 0) return `${hours}h ${mins.toString().padStart(2, '0')}min`
      return `${mins} min`
    },

    startWindowTimeTracking() {
      this.timeCheckInterval = setInterval(async () => {
        await this.checkWindowTimeRemaining()
      }, 30000)
    },

    async checkWindowTimeRemaining() {
      try {
        const result = await evaluationService.getTimeStatus(this.evaluation.id)
        if (result.success && result.data.window) {
          const window = result.data.window
          this.windowTimeLeft = window.time_left_minutes

          if (window.has_ended && !this.submitting) {
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

    isAnswered(questionId) {
      const answer = this.answers[questionId]
      if (Array.isArray(answer)) return answer.length > 0
      return answer !== undefined && answer !== null && answer !== ''
    },

    isOptionSelected(questionId, option) {
      return Array.isArray(this.answers[questionId]) && this.answers[questionId].includes(option)
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
        this.$router.push('/student/evaluations-list')
      }
    },

    confirmSubmit() {
      this.showConfirmModal = true
    },

    async submitEvaluation() {
      this.showConfirmModal = false
      this.submitting = true

      try {
        if (this.timer) clearInterval(this.timer)
        if (this.timeCheckInterval) clearInterval(this.timeCheckInterval)

        const result = await evaluationService.submitEvaluation(
          this.evaluation.id,
          this.submissionId,
          this.answers
        )

        if (result.success) {
          this.results = result.data
          this.showResultsModal = true
        }
      } catch (error) {
        console.error('Erreur soumission évaluation:', error)
        alert('Erreur lors de la soumission de l\'évaluation')
      } finally {
        this.submitting = false
      }
    },

    returnToEvaluations() {
      this.$router.push('/student/evaluations-list')
    }
  }
}
</script>

<style scoped>
.take-evaluation-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0;
}

/* Bandeau mode entraînement */
.practice-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f3e8ff, #ede9fe);
  border: 2px solid #8b5cf6;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: #5b21b6;
}

.practice-banner .fa {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.practice-title {
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0 0.25rem 0;
}

.practice-subtitle {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.85;
}

.results-practice {
  border-color: #8b5cf6 !important;
  background: #f5f3ff !important;
}

.practice-note-info {
  font-size: 0.8rem;
  color: #7c3aed;
  margin-top: 0.5rem;
  font-style: italic;
}

/* Alerts */
.alert-urgent {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #fee2e2;
  border: 2px solid #ef4444;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  animation: pulse 2s infinite;
  color: #991b1b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.alert-urgent .fa {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.alert-title {
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0 0.25rem 0;
}

.alert-subtitle {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
}

.alert-info {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary, #eff6ff);
  border: 1px solid var(--primary-color, #3b82f6);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.alert-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-info-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.alert-info-time {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color, #3b82f6);
}

/* Header */
.eval-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.eval-header-left {
  flex: 1;
  min-width: 0;
}

.eval-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.eval-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.eval-timer {
  text-align: center;
  flex-shrink: 0;
}

.timer-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color, #3b82f6);
  font-variant-numeric: tabular-nums;
}

.timer-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
}

.timer-warning .timer-value {
  color: #f59e0b;
}

.timer-danger .timer-value {
  color: #ef4444;
  animation: pulse 1s infinite;
}

/* Progress */
.eval-progress {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--bg-secondary, #e5e7eb);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color, #3b82f6), #8b5cf6);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* Questions */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.question-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.question-answered {
  border-left-color: #22c55e;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.question-number {
  background: var(--primary-color, #3b82f6);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.question-points {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.question-check {
  color: #22c55e;
  font-size: 1.25rem;
}

.question-text {
  font-size: 1.0625rem;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background: var(--bg-secondary, #f9fafb);
  border-color: var(--primary-color, #3b82f6);
}

.option-selected {
  border-color: var(--primary-color, #3b82f6);
  background: rgba(59, 130, 246, 0.08);
}

.option-input {
  accent-color: var(--primary-color, #3b82f6);
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.option-label {
  color: var(--text-primary);
  font-size: 0.9375rem;
}

/* Text inputs */
.text-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: border-color 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.textarea-input {
  resize: vertical;
  min-height: 120px;
}

/* Actions */
.eval-actions {
  display: flex;
  gap: 0.75rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.25rem 1.5rem;
}

.btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color, #d1d5db);
  background: var(--card-bg);
  color: var(--text-secondary);
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary);
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color, #3b82f6), #2563eb);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-full {
  width: 100%;
}

.actions-hint {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin: 0.75rem 0 0 0;
}

/* Error state */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-text {
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

.btn-back-error {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-error:hover {
  background: #dc2626;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  max-width: 480px;
  width: 100%;
  padding: 2rem;
}

.modal-results {
  text-align: center;
}

.modal-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.modal-text {
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.modal-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.modal-actions .btn-cancel,
.modal-actions .btn-submit {
  flex: 1;
}

/* Results icon */
.results-icon {
  margin-bottom: 1rem;
}

.results-icon .fa {
  font-size: 3rem;
  color: #22c55e;
}

/* Results score */
.results-score {
  background: var(--bg-secondary, #eff6ff);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.score-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.score-value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary-color, #3b82f6);
  margin: 0;
}

.score-unit {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.score-detail {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 0 0;
}

/* Responsive */
@media (max-width: 768px) {
  .eval-header {
    flex-direction: column;
    gap: 1rem;
  }

  .eval-timer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .timer-value {
    font-size: 1.5rem;
  }

  .timer-label {
    margin-top: 0;
  }

  .eval-actions {
    flex-direction: column;
  }

  .btn-cancel {
    justify-content: center;
  }

  .question-card {
    padding: 1.25rem;
  }

  .alert-info-row {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>
