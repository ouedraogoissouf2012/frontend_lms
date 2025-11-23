<template>
  <DashboardLayout>
    <!-- Header avec gradient -->
    <div class="page-header-gradient">
      <div class="header-content">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <button @click="$router.back()" class="breadcrumb-link">
            [RETOUR] Dashboard
          </button>
          <span class="breadcrumb-separator">→</span>
          <span class="breadcrumb-current">Gestion de la Matière</span>
        </div>

        <!-- Titre -->
        <div class="header-main">
          <div class="header-title-section">
            <h1 class="page-title-large">
              {{ matiere?.nom || 'Chargement...' }} [OK]
            </h1>

            <!-- Badges infos -->
            <div class="info-badges">
              <span v-if="matiere?.code" class="info-badge">
                [CODE] {{ matiere.code }}
              </span>
              <span v-if="matiere?.coefficient" class="info-badge">
                [COEF] {{ matiere.coefficient }}
              </span>
              <span v-if="matiere?.heures?.total" class="info-badge">
                [HEURES] {{ matiere.heures.total }}h
              </span>
            </div>
          </div>

          <button @click="$router.back()" class="btn-back">
            ← Retour
          </button>
        </div>

        <!-- Stats Cards -->
        <div v-if="statistiques" class="stats-grid-small">
          <div class="stat-card-small">
            <span class="stat-icon-small">[LESSON]</span>
            <div>
              <div class="stat-label-small">Leçons</div>
              <div class="stat-value-small">{{ statistiques.nombre_lessons || 0 }}</div>
            </div>
          </div>
          <div class="stat-card-small">
            <span class="stat-icon-small">[SEANCE]</span>
            <div>
              <div class="stat-label-small">Séances</div>
              <div class="stat-value-small">{{ statistiques.nombre_seances_programmees || 0 }}</div>
            </div>
          </div>
          <div class="stat-card-small">
            <span class="stat-icon-small">[EVAL]</span>
            <div>
              <div class="stat-label-small">Évaluations</div>
              <div class="stat-value-small">{{ statistiques.nombre_evaluations || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">Chargement...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <span class="alert-icon">[ERREUR]</span>
      <div class="alert-content">
        <p>{{ error }}</p>
        <button @click="loadMatiereDetails" class="btn-retry">
          Réessayer
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div v-else class="tabs-container">
      <!-- Tab Headers -->
      <div class="tabs-header">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-button', { 'tab-active': activeTab === tab.id }]"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="tab-badge">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tabs-content">
        <!-- Onglet Leçons -->
        <div v-if="activeTab === 'lessons'" class="tab-panel">
          <!-- Bouton création enseignant -->
          <div v-if="isTeacher" class="action-bar">
            <button @click="createLesson" class="btn-primary-large">
              <span>[+]</span>
              <span>Nouvelle leçon</span>
            </button>
          </div>

          <div v-if="lessons && lessons.length > 0" class="lessons-grid">
            <LessonCard
              v-for="lesson in lessons"
              :key="lesson.id"
              :lesson="lesson"
              :is-teacher="isTeacher"
              :show-progress="!isTeacher"
              :show-stats="isTeacher"
              :show-status="isTeacher"
              @view="viewLesson"
              @edit="editLesson"
              @delete="confirmDeleteLesson"
              @publish="publishLesson"
              @unpublish="unpublishLesson"
            />
          </div>

          <div v-else class="empty-state-large">
            <span class="empty-icon-large">[LESSON]</span>
            <h3>Aucune leçon disponible</h3>
            <p>{{ isTeacher ? 'Créez votre première leçon pour cette matière' : 'Aucune leçon n\'a encore été publiée' }}</p>
            <button v-if="isTeacher" @click="createLesson" class="btn-primary-large mt-4">
              Créer ma première leçon
            </button>
          </div>
        </div>

        <!-- Onglet Séances -->
        <div v-if="activeTab === 'seances'" class="tab-panel">
          <div v-if="seances && seances.length > 0" class="seances-list">
            <div
              v-for="seance in seances"
              :key="seance.id"
              class="seance-card"
              @click="viewSeance(seance.id)"
            >
              <div class="seance-header">
                <div class="seance-title-section">
                  <h3 class="seance-title">
                    {{ formatDate(seance.programmation?.date) }}
                  </h3>
                  <span v-if="seance.visio_enabled" class="badge badge-purple">
                    [VISIO] Visioconférence
                  </span>
                </div>
                <span class="seance-time">
                  {{ formatTime(seance.programmation?.heure_debut) }} -
                  {{ formatTime(seance.programmation?.heure_fin) }}
                </span>
              </div>

              <div class="seance-content">
                <p v-if="seance.programmation?.salle" class="seance-info">
                  [SALLE] {{ seance.programmation.salle }}
                </p>
                <p v-if="seance.classe" class="seance-info">
                  [CLASSE] {{ seance.classe.nom || seance.classe.libelle }}
                </p>
                <p v-if="seance.enseignant" class="seance-info">
                  [PROF] {{ seance.enseignant.nom }} {{ seance.enseignant.prenom }}
                </p>
              </div>

              <div class="seance-actions" @click.stop>
                <button
                  v-if="canJoinVisio(seance)"
                  @click="joinVisio(seance)"
                  class="btn-visio"
                >
                  [REJOINDRE] Visioconférence
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state-large">
            <span class="empty-icon-large">[SEANCE]</span>
            <h3>Aucune séance programmée</h3>
            <p>Les séances apparaîtront ici une fois programmées</p>
          </div>
        </div>

        <!-- Onglet Évaluations -->
        <div v-if="activeTab === 'evaluations'" class="tab-panel">
          <div v-if="evaluations && evaluations.length > 0" class="evaluations-list">
            <div
              v-for="evaluation in evaluations"
              :key="evaluation.id"
              class="evaluation-card"
            >
              <div class="evaluation-header">
                <div>
                  <h3 class="evaluation-title">{{ evaluation.titre }}</h3>
                  <p class="evaluation-info">{{ evaluation.description }}</p>
                </div>
                <span :class="['badge', getEvaluationStatusClass(evaluation.statut)]">
                  {{ evaluation.statut }}
                </span>
              </div>

              <div class="evaluation-meta">
                <span class="meta-item">[DATE] {{ formatDate(evaluation.date_debut) }}</span>
                <span class="meta-item">[DUREE] {{ evaluation.duree }} min</span>
                <span class="meta-item">[NOTE] /{{ evaluation.note_totale }}</span>
              </div>

              <div class="evaluation-actions">
                <button
                  v-if="canTakeEvaluation(evaluation)"
                  @click="takeEvaluation(evaluation.id)"
                  class="btn-primary"
                >
                  [START] Commencer l'évaluation
                </button>
                <button
                  v-else-if="evaluation.statut === 'termine'"
                  @click="viewEvaluationResults(evaluation.id)"
                  class="btn-secondary"
                >
                  [VIEW] Voir les résultats
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-state-large">
            <span class="empty-icon-large">[EVAL]</span>
            <h3>Aucune évaluation</h3>
            <p>Les évaluations pour cette matière apparaîtront ici</p>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import LessonCard from '@/components/lessons/LessonCard.vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import lessonService from '@/services/lesson'
import lmsService from '@/services/lms'

export default {
  name: 'MatiereDetailsModern',

  components: {
    DashboardLayout,
    LessonCard
  },

  data() {
    return {
      matiere: null,
      lessons: [],
      seances: [],
      evaluations: [],
      statistiques: null,
      loading: false,
      error: null,
      activeTab: 'lessons',
      isTeacher: false
    }
  },

  computed: {
    tabs() {
      return [
        {
          id: 'lessons',
          label: 'Leçons',
          count: this.lessons?.length || 0
        },
        {
          id: 'seances',
          label: 'Séances',
          count: this.seances?.length || 0
        },
        {
          id: 'evaluations',
          label: 'Évaluations',
          count: this.evaluations?.length || 0
        }
      ]
    }
  },

  methods: {
    async loadMatiereDetails() {
      this.loading = true
      this.error = null

      try {
        const matiereId = this.$route.params.id
        console.log('[LOAD] Chargement matière:', matiereId)

        // Charger détails matière depuis KLASSCI
        this.matiere = await klassciService.getMatiereDetails(matiereId)

        // Charger leçons
        const lessonsResponse = await lessonService.getLessons({ matiere_id: matiereId })
        this.lessons = lessonsResponse.data || []

        // Charger séances
        // Charger TOUTES les seances de l'etudiant via LMS (avec filtres backend)
        const allSeancesResponse = await lmsService.getMyClassesSeances()

        // Filtrer par matiere cote client
        this.seances = (allSeancesResponse.data || allSeancesResponse || []).filter(s => {
          // Comparer par ID de matiere
          return s.matiere?.id == matiereId || s.klassci_matiere_id == matiereId
        })

        console.log('[OK] Seances filtrees pour matiere', matiereId, ':', this.seances.length)

        // Charger évaluations
        this.evaluations = await klassciService.getEvaluationsByMatiere(matiereId)

        // Stats
        this.statistiques = {
          nombre_lessons: this.lessons.length,
          nombre_seances_programmees: this.seances.length,
          nombre_evaluations: this.evaluations.length
        }

        console.log('[OK] Matière chargée:', this.matiere)
      } catch (err) {
        console.error('[ERREUR] Chargement matière:', err)
        this.error = 'Impossible de charger les détails de la matière'
      } finally {
        this.loading = false
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    formatTime(timeString) {
      if (!timeString) return 'N/A'
      return timeString.substring(0, 5)
    },

    // Leçons
    createLesson() {
      this.$router.push({
        name: 'LessonCreate',
        query: { matiere_id: this.$route.params.id }
      })
    },

    viewLesson(lessonId) {
      this.$router.push(`/lessons/${lessonId}`)
    },

    editLesson(lessonId) {
      this.$router.push(`/teacher/lessons/${lessonId}/edit`)
    },

    async confirmDeleteLesson(lessonId) {
      if (confirm('[CONFIRMER] Voulez-vous vraiment supprimer cette leçon ?')) {
        try {
          await lessonService.deleteLesson(lessonId)
          this.lessons = this.lessons.filter(l => l.id !== lessonId)
          console.log('[OK] Leçon supprimée')
        } catch (err) {
          console.error('[ERREUR] Suppression:', err)
          alert('Erreur lors de la suppression')
        }
      }
    },

    async publishLesson(lessonId) {
      try {
        await lessonService.publishLesson(lessonId)
        const lesson = this.lessons.find(l => l.id === lessonId)
        if (lesson) lesson.statut = 'publie'
        console.log('[OK] Leçon publiée')
      } catch (err) {
        console.error('[ERREUR] Publication:', err)
      }
    },

    async unpublishLesson(lessonId) {
      try {
        await lessonService.unpublishLesson(lessonId)
        const lesson = this.lessons.find(l => l.id === lessonId)
        if (lesson) lesson.statut = 'brouillon'
        console.log('[OK] Leçon dépubliée')
      } catch (err) {
        console.error('[ERREUR] Dépublication:', err)
      }
    },

    // Séances
    viewSeance(seanceId) {
      this.$router.push(`/seances/${seanceId}`)
    },

    canJoinVisio(seance) {
      if (!seance.visio_enabled) return false
      const now = new Date()
      const seanceDate = new Date(seance.programmation?.date + ' ' + seance.programmation?.heure_debut)
      const diff = (seanceDate - now) / 60000 // minutes
      return diff >= -15 && diff <= 120 // 15 min avant à 2h après
    },

    joinVisio(seance) {
      const roomName = `seance-${seance.id}`
      this.$router.push({
        name: 'VideoConference',
        params: { roomName },
        query: { title: this.matiere?.nom }
      })
    },

    // Évaluations
    canTakeEvaluation(evaluation) {
      return evaluation.statut === 'en_cours' || evaluation.statut === 'planifie'
    },

    takeEvaluation(evaluationId) {
      this.$router.push(`/student/evaluations/${evaluationId}/take`)
    },

    viewEvaluationResults(evaluationId) {
      this.$router.push(`/student/evaluations/${evaluationId}/results`)
    },

    getEvaluationStatusClass(statut) {
      const classes = {
        'planifie': 'badge-warning',
        'en_cours': 'badge-success',
        'termine': 'badge-neutral'
      }
      return classes[statut] || 'badge-neutral'
    }
  },

  mounted() {
    const user = auth.getUser()
    this.isTeacher = ['enseignant', 'teacher', 'coordinateur'].includes(user?.role)
    this.loadMatiereDetails()
  }
}
</script>

<style scoped>
/* Header Gradient */
.page-header-gradient {
  background: linear-gradient(135deg, var(--blue-600) 0%, var(--blue-700) 100%);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
  box-shadow: var(--shadow-xl);
  color: white;
}

[data-theme="dark"] .page-header-gradient {
  background: linear-gradient(135deg, var(--blue-700) 0%, var(--blue-900) 100%);
}

.header-content {
  max-width: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.breadcrumb-link {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: opacity var(--transition-fast);
}

.breadcrumb-link:hover {
  opacity: 0.8;
}

.breadcrumb-separator {
  opacity: 0.6;
}

.breadcrumb-current {
  font-weight: 600;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
}

.header-title-section {
  flex: 1;
}

.page-title-large {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  line-height: 1.2;
}

.info-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.info-badge {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Stats Grid Small */
.stats-grid-small {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.stat-card-small {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon-small {
  font-size: 1.5rem;
}

.stat-label-small {
  font-size: var(--font-size-sm);
  opacity: 0.9;
  margin-bottom: var(--spacing-xs);
}

.stat-value-small {
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

/* Tabs */
.tabs-container {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.tab-button {
  flex: 1;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.tab-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-button.tab-active {
  border-bottom-color: var(--blue-600);
  color: var(--blue-600);
  background: var(--card-bg);
}

.tab-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.tab-active .tab-badge {
  background: var(--blue-100);
  color: var(--blue-700);
}

[data-theme="dark"] .tab-active .tab-badge {
  background: rgba(59, 130, 246, 0.2);
  color: var(--blue-400);
}

.tabs-content {
  padding: var(--spacing-2xl);
}

.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

/* Action Bar */
.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-xl);
}

.btn-primary-large {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-md);
}

.btn-primary-large:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Lessons Grid */
.lessons-grid {
  display: grid;
  gap: var(--spacing-lg);
}

/* Seances List */
.seances-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.seance-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: all var(--transition-base);
}

.seance-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.seance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.seance-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.seance-time {
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.seance-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.seance-info {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.seance-actions {
  display: flex;
  gap: var(--spacing-md);
}

.btn-visio {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-visio:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}

/* Evaluations List */
.evaluations-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.evaluation-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.evaluation-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.evaluation-info {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.evaluation-meta {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.meta-item {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.evaluation-actions {
  display: flex;
  gap: var(--spacing-md);
}

.btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover {
  background: var(--btn-primary-hover);
}

.btn-secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--btn-secondary-hover);
}

/* Badges */
.badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.badge-purple {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.badge-success {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.badge-warning {
  background: var(--warning-bg);
  color: var(--warning-text);
  border: 1px solid var(--warning-border);
}

.badge-neutral {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

/* Empty State */
.empty-state-large {
  text-align: center;
  padding: var(--spacing-2xl) * 2;
}

.empty-icon-large {
  font-size: 4rem;
  display: block;
  margin-bottom: var(--spacing-xl);
  opacity: 0.3;
}

.empty-state-large h3 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-state-large p {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

/* Loading & Error */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl) * 2;
  gap: var(--spacing-lg);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-primary);
  border-top-color: var(--blue-600);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
}

.alert {
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  display: flex;
  gap: var(--spacing-md);
}

.alert-error {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  color: var(--error-text);
}

.alert-icon {
  font-size: 1.5rem;
  font-weight: 700;
}

.alert-content {
  flex: 1;
}

.btn-retry {
  margin-top: var(--spacing-md);
  background: var(--error-text);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title-large {
    font-size: 1.75rem;
  }

  .stats-grid-small {
    grid-template-columns: 1fr;
  }

  .header-main {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .tabs-header {
    overflow-x: auto;
  }

  .tab-button {
    flex: none;
    min-width: 120px;
  }
}
</style>
