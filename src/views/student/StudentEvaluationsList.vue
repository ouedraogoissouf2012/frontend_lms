<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Évaluations</h1>
          <p class="page-subtitle">Toutes vos évaluations, toutes matières confondues</p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="evaluations-list">
        <SkeletonLoader type="card" v-for="i in 4" :key="i" height="150px" />
      </div>

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon">⚠</div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadEvaluations" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Section: Évaluations en cours -->
      <div v-if="!loading && evaluationsEnCours.length > 0" class="section">
        <h2 class="section-title">📝 Évaluations à faire</h2>
        <div class="evaluations-list">
          <div
            v-for="evaluation in evaluationsEnCours"
            :key="evaluation.id"
            class="evaluation-card"
            @click="navigateToEvaluation(evaluation)"
          >
            <div class="evaluation-header">
              <div class="evaluation-info">
                <h3 class="evaluation-title">{{ evaluation.titre || 'Évaluation' }}</h3>
                <p class="evaluation-matiere">
                  {{ evaluation.matiere_nom || 'Matière inconnue' }} - {{ evaluation.classe_nom || 'Classe' }}
                </p>
              </div>
              <span
                :class="[
                  'evaluation-status',
                  isEvaluationAvailable(evaluation) ? 'status-active' : 'status-planned'
                ]"
              >
                {{ isEvaluationAvailable(evaluation) ? 'En cours' : 'Programmée' }}
              </span>
            </div>

            <div class="evaluation-details">
              <div class="detail-item">
                <CalendarIcon class="detail-icon" />
                <span>{{ formatDate(evaluation.date_evaluation) }}</span>
              </div>
              <div class="detail-item" v-if="evaluation.duree_minutes">
                <ClockIcon class="detail-icon" />
                <span>{{ evaluation.duree_minutes }} min</span>
              </div>
              <div class="detail-item">
                <DocumentTextIcon class="detail-icon" />
                <span>Coef. {{ evaluation.coefficient }}</span>
              </div>
            </div>

            <div class="evaluation-actions">
              <button
                :class="[
                  isEvaluationAvailable(evaluation) ? 'btn-primary' : 'btn-disabled'
                ]"
                :disabled="!isEvaluationAvailable(evaluation)"
              >
                <PlayIcon class="w-5 h-5" />
                <span>{{ isEvaluationAvailable(evaluation) ? 'Commencer l\'évaluation' : 'Pas encore disponible' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Évaluations terminées -->
      <div v-if="!loading && evaluationsTerminees.length > 0" class="section">
        <h2 class="section-title">✅ Évaluations terminées</h2>
        <div class="evaluations-list">
          <div
            v-for="evaluation in evaluationsTerminees"
            :key="evaluation.id"
            class="evaluation-card"
            @click="navigateToEvaluation(evaluation)"
          >
            <div class="evaluation-header">
              <div class="evaluation-info">
                <h3 class="evaluation-title">{{ evaluation.titre || 'Évaluation' }}</h3>
                <p class="evaluation-matiere">
                  {{ evaluation.matiere_nom || 'Matière inconnue' }} - {{ evaluation.classe_nom || 'Classe' }}
                </p>
              </div>
              <span class="evaluation-status status-completed">
                Terminée
              </span>
            </div>

            <div class="evaluation-details">
              <div class="detail-item">
                <CalendarIcon class="detail-icon" />
                <span>{{ formatDate(evaluation.date_evaluation) }}</span>
              </div>
              <div class="detail-item" v-if="evaluation.student_submission">
                <span class="note-badge">
                  {{ evaluation.student_submission.note_sur_20 }}/20
                </span>
              </div>
            </div>

            <div class="evaluation-actions">
              <button class="btn-secondary">
                <EyeIcon class="w-5 h-5" />
                <span>Voir mes résultats</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon-wrapper">
          <DocumentTextIcon class="empty-icon" />
        </div>
        <h3 class="empty-title">Aucune évaluation disponible</h3>
        <p class="empty-description">
          Vous n'avez pas encore d'évaluations à effectuer.<br>
          Les nouvelles évaluations apparaîtront ici une fois programmées.
        </p>
        <div class="empty-actions">
          <button @click="loadEvaluations" class="btn-reload">
            Actualiser
          </button>
          <router-link to="/student/dashboard" class="btn-secondary-link">
            Retour au dashboard
          </router-link>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import api from '@/services/api'
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'StudentEvaluationsList',
  components: {
    DashboardLayout,
    SkeletonLoader,
    DocumentTextIcon,
    CalendarIcon,
    ClockIcon,
    PlayIcon,
    EyeIcon
  },
  data() {
    return {
      evaluations: [],
      loading: false,
      error: null
    }
  },
  computed: {
    evaluationsEnCours() {
      return this.evaluations.filter(e => !e.student_submission || (e.student_submission.status !== 'soumis' && e.student_submission.status !== 'corrige'))
    },
    evaluationsTerminees() {
      return this.evaluations.filter(e => e.student_submission && (e.student_submission.status === 'soumis' || e.student_submission.status === 'corrige'))
    }
  },
  methods: {
    async loadEvaluations() {
      this.loading = true
      this.error = null

      try {
        console.log('[EVALUATIONS] Chargement des évaluations...')
        const response = await api.get('/evaluations')
        this.evaluations = response.data || []
        console.log('[OK] Évaluations chargées:', this.evaluations)
      } catch (err) {
        console.error('[ERREUR] Erreur chargement évaluations:', err)
        this.error = 'Impossible de charger vos évaluations. Veuillez réessayer.'
      } finally {
        this.loading = false
      }
    },

    navigateToEvaluation(evaluation) {
      // Si l'évaluation est terminée (soumise), aller vers les résultats
      if (evaluation.student_submission && (evaluation.student_submission.status === 'soumis' || evaluation.student_submission.status === 'corrige')) {
        this.$router.push({
          name: 'EvaluationResults',
          params: { id: evaluation.id }
        })
      }
      // Sinon, vérifier si l'évaluation peut être démarrée
      else if (this.isEvaluationAvailable(evaluation) && evaluation.is_published && evaluation.status !== 'terminee') {
        this.$router.push({
          name: 'TakeEvaluation',
          params: { id: evaluation.id }
        })
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    isEvaluationAvailable(evaluation) {
      if (!evaluation.date_evaluation) return true
      const now = new Date()
      const evaluationDate = new Date(evaluation.date_evaluation)
      return now >= evaluationDate
    }
  },
  mounted() {
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

.section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

.evaluations-list {
  display: grid;
  gap: 1.5rem;
}

.evaluation-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.evaluation-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.evaluation-info {
  flex: 1;
}

.evaluation-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.evaluation-matiere {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.evaluation-status {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-planned {
  background: #dbeafe;
  color: #1e40af;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
}

.status-completed {
  background: #f3f4f6;
  color: #4b5563;
}

.evaluation-details {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.detail-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.note-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
}

.evaluation-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: scale(1.02);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-disabled {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: not-allowed;
  transition: all 0.2s;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  opacity: 0.6;
}

.btn-disabled:hover {
  transform: none;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-reload, .btn-secondary-link {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
}

.btn-reload {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-reload:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}

.btn-secondary-link {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary-link:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
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
  font-size: 1.125rem;
  font-weight: 700;
  color: #991B1B;
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: #B91C1C;
  margin: 0;
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
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
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .evaluation-header {
    flex-direction: column;
    gap: 1rem;
  }

  .evaluation-details {
    flex-direction: column;
    gap: 0.5rem;
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
