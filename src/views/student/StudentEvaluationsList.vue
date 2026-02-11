<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Évaluations</h1>
          <p class="page-subtitle">Consultez et passez vos évaluations en ligne</p>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des evaluations..." />

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadEvaluations" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Section: Évaluations à faire (fenêtre ouverte ou pas encore ouverte, sans soumission terminée) -->
        <div v-if="evaluationsAFaire.length > 0" class="section">
          <h2 class="section-title"><i class="fa fa-pencil-square-o"></i> Évaluations à faire</h2>
          <div class="evaluations-list">
            <div
              v-for="evaluation in evaluationsAFaire"
              :key="'todo-' + evaluation.id"
              class="evaluation-card"
            >
              <div class="evaluation-header">
                <div class="evaluation-info">
                  <h3 class="evaluation-title">{{ evaluation.titre || 'Évaluation' }}</h3>
                  <p class="evaluation-matiere">
                    {{ evaluation.matiere?.nom || evaluation.matiere_nom || 'Matière' }}
                    <span v-if="evaluation.classe?.nom || evaluation.classe?.libelle || evaluation.classe_nom">
                       - {{ evaluation.classe?.nom || evaluation.classe?.libelle || evaluation.classe_nom }}
                    </span>
                  </p>
                </div>
                <span :class="['evaluation-status', getStatusClass(evaluation)]">
                  {{ getStatusLabel(evaluation) }}
                </span>
              </div>

              <div class="evaluation-details">
                <div class="detail-item">
                  <CalendarIcon class="detail-icon" />
                  <span>{{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}</span>
                </div>
                <div class="detail-item" v-if="evaluation.duree_minutes">
                  <ClockIcon class="detail-icon" />
                  <span>{{ evaluation.duree_minutes }} min</span>
                </div>
                <div class="detail-item">
                  <DocumentTextIcon class="detail-icon" />
                  <span>Coef. {{ evaluation.programmation?.coefficient || evaluation.coefficient || 1 }}</span>
                </div>
                <div class="detail-item" v-if="evaluation.questions_count">
                  <span>{{ evaluation.questions_count }} questions</span>
                </div>
              </div>

              <!-- Fenêtre temporelle -->
              <div v-if="evaluation.programmation?.window" class="window-info" :class="getWindowClass(evaluation)">
                <ClockIcon class="w-4 h-4" />
                <span v-if="!evaluation.programmation.window.has_started">
                  Ouvrira le {{ formatDateTime(evaluation.programmation.window.start_at) }}
                </span>
                <span v-else-if="evaluation.programmation.window.is_open">
                  Disponible jusqu'au {{ formatDateTime(evaluation.programmation.window.end_at) }}
                  <strong v-if="evaluation.programmation.window.time_left_minutes">
                    ({{ evaluation.programmation.window.time_left_minutes }} min restantes)
                  </strong>
                </span>
              </div>

              <!-- En cours -->
              <div v-if="evaluation.student_submission?.status === 'en_cours'" class="submission-info submission-ongoing">
                <i class="fa fa-spinner fa-spin"></i>
                <span>Tentative en cours - reprenez là où vous en étiez</span>
              </div>

              <div class="evaluation-actions">
                <button
                  v-if="evaluation.student_submission?.status === 'en_cours'"
                  @click="continueEvaluation(evaluation)"
                  class="btn-action btn-continue"
                >
                  <PlayIcon class="w-5 h-5" />
                  Continuer l'évaluation
                </button>
                <button
                  v-else-if="isWindowOpen(evaluation)"
                  @click="startEvaluation(evaluation)"
                  class="btn-action btn-start"
                >
                  <PlayIcon class="w-5 h-5" />
                  Commencer l'évaluation
                </button>
                <button
                  v-else
                  disabled
                  class="btn-action btn-disabled"
                >
                  <ClockIcon class="w-5 h-5" />
                  Pas encore disponible
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Évaluations terminées (avec note) -->
        <div v-if="evaluationsTerminees.length > 0" class="section">
          <h2 class="section-title"><i class="fa fa-check-circle"></i> Évaluations terminées</h2>
          <div class="evaluations-list">
            <div
              v-for="evaluation in evaluationsTerminees"
              :key="'done-' + evaluation.id"
              class="evaluation-card"
            >
              <div class="evaluation-header">
                <div class="evaluation-info">
                  <h3 class="evaluation-title">{{ evaluation.titre || 'Évaluation' }}</h3>
                  <p class="evaluation-matiere">
                    {{ evaluation.matiere?.nom || evaluation.matiere_nom || 'Matière' }}
                    <span v-if="evaluation.classe?.nom || evaluation.classe?.libelle || evaluation.classe_nom">
                       - {{ evaluation.classe?.nom || evaluation.classe?.libelle || evaluation.classe_nom }}
                    </span>
                  </p>
                </div>
                <span class="evaluation-status status-completed">
                  Terminée
                </span>
              </div>

              <div class="evaluation-details">
                <div class="detail-item">
                  <CalendarIcon class="detail-icon" />
                  <span>{{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}</span>
                </div>
                <div class="detail-item">
                  <span class="note-badge" :class="getNoteClass(evaluation.student_submission?.note_sur_20)">
                    {{ evaluation.student_submission?.note_sur_20 ?? '-' }}/20
                  </span>
                </div>
              </div>

              <div class="evaluation-actions">
                <button
                  @click="viewResults(evaluation)"
                  class="btn-action btn-results"
                >
                  <EyeIcon class="w-5 h-5" />
                  Voir mes résultats
                </button>
                <button
                  @click="startEvaluation(evaluation)"
                  class="btn-action btn-practice"
                >
                  <ArrowPathIcon class="w-5 h-5" />
                  S'entraîner
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: S'entraîner (passées, jamais soumises) -->
        <div v-if="evaluationsEntrainement.length > 0" class="section">
          <h2 class="section-title"><i class="fa fa-graduation-cap"></i> S'entraîner</h2>
          <p class="section-description">Ces évaluations sont passées mais vous pouvez vous y exercer pour progresser.</p>
          <div class="evaluations-list">
            <div
              v-for="evaluation in evaluationsEntrainement"
              :key="'practice-' + evaluation.id"
              class="evaluation-card card-practice"
            >
              <div class="evaluation-header">
                <div class="evaluation-info">
                  <h3 class="evaluation-title">{{ evaluation.titre || 'Évaluation' }}</h3>
                  <p class="evaluation-matiere">
                    {{ evaluation.matiere?.nom || evaluation.matiere_nom || 'Matière' }}
                    <span v-if="evaluation.classe?.nom || evaluation.classe?.libelle || evaluation.classe_nom">
                       - {{ evaluation.classe?.nom || evaluation.classe?.libelle || evaluation.classe_nom }}
                    </span>
                  </p>
                </div>
                <span class="evaluation-status status-practice">
                  Entraînement
                </span>
              </div>

              <div class="evaluation-details">
                <div class="detail-item">
                  <CalendarIcon class="detail-icon" />
                  <span>{{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}</span>
                </div>
                <div class="detail-item" v-if="evaluation.duree_minutes">
                  <ClockIcon class="detail-icon" />
                  <span>{{ evaluation.duree_minutes }} min</span>
                </div>
                <div class="detail-item" v-if="evaluation.questions_count">
                  <span>{{ evaluation.questions_count }} questions</span>
                </div>
              </div>

              <div class="evaluation-actions">
                <button
                  @click="startEvaluation(evaluation)"
                  class="btn-action btn-practice"
                >
                  <PlayIcon class="w-5 h-5" />
                  S'entraîner
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="evaluations.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <DocumentTextIcon class="empty-icon" />
          </div>
          <h3 class="empty-title">Aucune évaluation disponible</h3>
          <p class="empty-description">
            Vous n'avez pas encore d'évaluations à effectuer.<br>
            Les nouvelles évaluations apparaîtront ici une fois programmées.
          </p>
          <div class="empty-actions">
            <button @click="loadEvaluations" class="btn-action btn-start">
              Actualiser
            </button>
          </div>
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import evaluationService from '@/services/evaluation'
import api, { auth } from '@/services/api'
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'StudentEvaluationsList',
  components: {
    DashboardLayout,
    ContentLoader,
    DocumentTextIcon,
    CalendarIcon,
    ClockIcon,
    PlayIcon,
    EyeIcon,
    ArrowPathIcon
  },
  data() {
    return {
      evaluations: [],
      loading: false,
      error: null,
      user: null
    }
  },
  computed: {
    // Évaluations à faire : fenêtre ouverte ou pas encore commencée, pas de soumission terminée
    evaluationsAFaire() {
      return this.evaluations.filter(e => {
        const hasFinishedSubmission = e.student_submission &&
          (e.student_submission.status === 'soumis' || e.student_submission.status === 'corrige')
        if (hasFinishedSubmission) return false

        // Si en cours de tentative, toujours montrer
        if (e.student_submission?.status === 'en_cours') return true

        // Pas encore passée ou fenêtre ouverte
        return !this.isExpired(e)
      })
    },

    // Évaluations terminées avec soumission
    evaluationsTerminees() {
      return this.evaluations.filter(e => {
        return e.student_submission &&
          (e.student_submission.status === 'soumis' || e.student_submission.status === 'corrige')
      })
    },

    // Évaluations passées sans soumission terminée (pour s'entraîner)
    evaluationsEntrainement() {
      return this.evaluations.filter(e => {
        const hasFinishedSubmission = e.student_submission &&
          (e.student_submission.status === 'soumis' || e.student_submission.status === 'corrige')
        if (hasFinishedSubmission) return false
        if (e.student_submission?.status === 'en_cours') return false

        // Seulement les évaluations passées
        return this.isExpired(e)
      })
    }
  },
  methods: {
    async loadEvaluations() {
      this.loading = true
      this.error = null

      try {
        const response = await api.get('/evaluations/student')

        if (response.success && response.data) {
          this.evaluations = response.data
        } else if (Array.isArray(response.data)) {
          this.evaluations = response.data
        } else if (Array.isArray(response)) {
          this.evaluations = response
        } else {
          this.evaluations = []
        }
      } catch (err) {
        console.error('[ERREUR] Erreur chargement évaluations:', err)
        if (err.response?.status === 401) {
          this.error = 'Session expirée. Veuillez vous reconnecter.'
        } else {
          this.error = err.response?.data?.message || 'Impossible de charger vos évaluations. Veuillez réessayer.'
        }
      } finally {
        this.loading = false
      }
    },

    // Vérifie si l'évaluation est expirée (fenêtre fermée ou date passée)
    isExpired(evaluation) {
      // Vérifier la fenêtre KLASSCI
      const window = evaluation.programmation?.window
      if (window) {
        return window.has_started && !window.is_open
      }

      // Fallback : vérifier la date + durée
      const dateEval = evaluation.programmation?.date_evaluation || evaluation.date_evaluation
      if (!dateEval) return false

      const startDate = new Date(dateEval)
      if (isNaN(startDate.getTime())) return false

      const durationMs = (evaluation.duree_minutes || 60) * 60000
      const endDate = new Date(startDate.getTime() + durationMs)
      return new Date() > endDate
    },

    // Vérifie si la fenêtre est ouverte (peut commencer maintenant)
    isWindowOpen(evaluation) {
      const window = evaluation.programmation?.window
      if (window) {
        return window.is_open === true
      }

      // Fallback : vérifier la date + durée
      const dateEval = evaluation.programmation?.date_evaluation || evaluation.date_evaluation
      if (!dateEval) return true // Pas de date = toujours disponible

      const startDate = new Date(dateEval)
      if (isNaN(startDate.getTime())) return false

      const now = new Date()
      const durationMs = (evaluation.duree_minutes || 60) * 60000
      const endDate = new Date(startDate.getTime() + durationMs)

      return now >= startDate && now <= endDate
    },

    getStatusLabel(evaluation) {
      if (evaluation.student_submission?.status === 'en_cours') return 'En cours'
      if (this.isWindowOpen(evaluation)) return 'Disponible'
      return 'Programmée'
    },

    getStatusClass(evaluation) {
      if (evaluation.student_submission?.status === 'en_cours') return 'status-ongoing'
      if (this.isWindowOpen(evaluation)) return 'status-active'
      return 'status-planned'
    },

    getWindowClass(evaluation) {
      const window = evaluation.programmation?.window
      if (!window) return ''
      if (!window.has_started) return 'window-pending'
      if (window.is_open) return 'window-open'
      return 'window-closed'
    },

    getNoteClass(note) {
      if (note === null || note === undefined) return ''
      if (note >= 16) return 'note-excellent'
      if (note >= 14) return 'note-good'
      if (note >= 10) return 'note-average'
      return 'note-low'
    },

    formatDate(dateString) {
      if (!dateString) return 'Non définie'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatDateTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    async startEvaluation(evaluation) {
      if (!this.user) return

      try {
        const result = await evaluationService.startEvaluation(evaluation.id, this.user.klassci_id)
        if (result.success) {
          const query = { submission_id: result.data.id }
          if (result.is_practice) query.practice = '1'
          this.$router.push({
            name: 'TakeEvaluation',
            params: { id: evaluation.id },
            query
          })
        } else {
          alert(result.message || 'Impossible de démarrer l\'évaluation')
        }
      } catch (error) {
        console.error('Erreur démarrage évaluation:', error)
        const message = error.response?.data?.message || 'Impossible de démarrer l\'évaluation'
        alert(message)
      }
    },

    continueEvaluation(evaluation) {
      this.$router.push({
        name: 'TakeEvaluation',
        params: { id: evaluation.id },
        query: { submission_id: evaluation.student_submission.id }
      })
    },

    viewResults(evaluation) {
      this.$router.push({
        name: 'EvaluationResults',
        params: { id: evaluation.id }
      })
    }
  },
  mounted() {
    this.user = auth.getUser()
    if (!this.user) {
      this.$router.push('/login')
      return
    }
    this.loadEvaluations()
  }
}
</script>

<style scoped>
.evaluations-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Sections */
.section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0 0 1.25rem 0;
}

/* Cards */
.evaluations-list {
  display: grid;
  gap: 1.25rem;
}

.evaluation-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.evaluation-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.card-practice {
  border-left: 4px solid #8b5cf6;
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.evaluation-info {
  flex: 1;
  min-width: 0;
}

.evaluation-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.evaluation-matiere {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

/* Status badges */
.evaluation-status {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: 1rem;
}

.status-planned {
  background: #dbeafe;
  color: #1e40af;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
}

.status-ongoing {
  background: #fef3c7;
  color: #92400e;
}

.status-completed {
  background: #f0fdf4;
  color: #166534;
}

.status-practice {
  background: #ede9fe;
  color: #6d28d9;
}

/* Details */
.evaluation-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.detail-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

/* Note badge */
.note-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
}

.note-excellent {
  background: #dcfce7;
  color: #166534;
}

.note-good {
  background: #dbeafe;
  color: #1e40af;
}

.note-average {
  background: #fef3c7;
  color: #92400e;
}

.note-low {
  background: #fee2e2;
  color: #991b1b;
}

/* Window info */
.window-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.window-pending {
  background: #fef3c7;
  color: #92400e;
}

.window-open {
  background: #dcfce7;
  color: #15803d;
}

.window-closed {
  background: #fee2e2;
  color: #991b1b;
}

/* Submission info */
.submission-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.submission-ongoing {
  background: #fef3c7;
  color: #92400e;
}

/* Action buttons */
.evaluation-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-start {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.btn-start:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: translateY(-1px);
}

.btn-continue {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-continue:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-1px);
}

.btn-results {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary);
  border: 1px solid var(--border-color, #e5e7eb);
}

.btn-results:hover {
  background: var(--bg-tertiary, #e5e7eb);
}

.btn-practice {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.btn-practice:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-1px);
}

.btn-disabled {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-tertiary, #9ca3af);
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-disabled:hover {
  transform: none;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1.5rem;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.empty-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 2rem;
  color: #DC2626;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 1rem;
  font-weight: 700;
  color: #991B1B;
  margin: 0 0 0.25rem 0;
}

.error-message {
  color: #B91C1C;
  margin: 0;
  font-size: 0.875rem;
}

.error-retry-btn {
  padding: 0.625rem 1.25rem;
  background: #DC2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.error-retry-btn:hover {
  background: #B91C1C;
}

/* Responsive */
@media (max-width: 768px) {
  .evaluation-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .evaluation-status {
    margin-left: 0;
    align-self: flex-start;
  }

  .evaluation-details {
    flex-direction: column;
    gap: 0.5rem;
  }

  .evaluation-actions {
    flex-direction: column;
  }

  .btn-action {
    justify-content: center;
    width: 100%;
  }

  .error-state {
    flex-direction: column;
    text-align: center;
  }

  .error-retry-btn {
    width: 100%;
  }
}
</style>
