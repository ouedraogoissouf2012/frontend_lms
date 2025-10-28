<template>
  <DashboardLayout>
    <!-- Welcome Section -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          Bienvenue, <span class="text-gradient">{{ user?.name }}</span> 👋
        </h1>
        <p class="page-subtitle">Voici un aperçu de votre parcours d'apprentissage</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">Chargement de vos données...</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="alert alert-error">
      <span class="alert-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- Dashboard Content -->
    <div v-if="!loading && dashboardData" class="dashboard-content">
      <!-- Classe Info Card -->
      <div v-if="dashboardData.classe" class="classe-card glass">
        <div class="classe-header">
          <span class="classe-icon">🏫</span>
          <div class="classe-info">
            <h3 class="classe-name">{{ dashboardData.classe.name || dashboardData.classe.libelle }}</h3>
            <p class="classe-details">
              {{ dashboardData.classe.filiere?.name || dashboardData.classe.filiere?.nom || dashboardData.classe.filiere?.libelle }}
              • {{ dashboardData.classe.niveau?.name || dashboardData.classe.niveau?.nom || dashboardData.classe.niveau?.libelle }}
            </p>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div v-if="dashboardData.statistiques" class="stats-grid">
        <StatCard
          icon="📊"
          iconBg="linear-gradient(135deg, #0052cc 0%, #0747a6 100%)"
          label="Moyenne Générale"
          :value="dashboardData.statistiques.moyenne_generale || 'N/A'"
        />

        <StatCard
          icon="✅"
          iconBg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
          label="Taux de Présence"
          :value="`${dashboardData.statistiques.taux_presence || 0}%`"
          :trend="`+${dashboardData.statistiques.taux_presence || 0}%`"
          trendDirection="up"
        />

        <StatCard
          icon="📚"
          iconBg="linear-gradient(135deg, #a855f7 0%, #9333ea 100%)"
          label="Cours Suivis"
          :value="dashboardData.cours?.length || 0"
          subtitle="matières actives"
        />

        <StatCard
          icon="📝"
          iconBg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
          label="Quiz à Venir"
          :value="dashboardData.quiz?.length || 0"
          subtitle="évaluations planifiées"
        />
      </div>

      <!-- Mes Cours -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📖</span>
            Mes Cours
          </h2>
        </div>

        <div v-if="dashboardData.cours && dashboardData.cours.length > 0" class="cours-grid">
          <div
            v-for="cours in dashboardData.cours"
            :key="cours.id || cours.matiere_id"
            class="cours-card"
            @click="navigateToMatiere(cours)"
          >
            <div class="cours-header">
              <div class="cours-icon">📚</div>
              <div class="cours-badge">
                Coef. {{ cours.coefficient || cours.matiere?.coefficient || 'N/A' }}
              </div>
            </div>
            <h3 class="cours-title">
              {{ cours.name || cours.nom || cours.libelle || cours.matiere?.name || cours.matiere?.nom || 'Cours sans nom' }}
            </h3>
            <button class="btn-primary">
              <span>Voir détails</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <div v-else class="empty-state">
          <span class="empty-icon">📚</span>
          <p>Aucun cours disponible</p>
        </div>
      </section>

      <!-- Quiz à Venir -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📝</span>
            Quiz à Venir
          </h2>
        </div>

        <div v-if="dashboardData.quiz && dashboardData.quiz.length > 0" class="quiz-list">
          <div
            v-for="quiz in dashboardData.quiz"
            :key="quiz.id"
            class="quiz-card"
          >
            <div class="quiz-header">
              <div>
                <h3 class="quiz-title">{{ quiz.titre }}</h3>
                <p class="quiz-matiere">{{ quiz.matiere?.name }}</p>
                <p class="quiz-date">📅 {{ formatDate(quiz.date) }}</p>
              </div>
              <span
                :class="{
                  'badge-success': quiz.statut === 'planifie',
                  'badge-info': quiz.statut === 'en_cours',
                  'badge-neutral': quiz.statut === 'termine'
                }"
                class="badge"
              >
                {{ quiz.statut }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <span class="empty-icon">📝</span>
          <p>Aucun quiz à venir</p>
        </div>
      </section>

      <!-- Mes Notes -->
      <section v-if="dashboardData.notes && dashboardData.notes.length > 0" class="section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📊</span>
            Mes Dernières Notes
          </h2>
        </div>

        <div class="notes-list">
          <div
            v-for="note in dashboardData.notes"
            :key="note.id"
            class="note-item"
          >
            <div>
              <p class="note-title">{{ note.evaluation?.titre || 'Évaluation' }}</p>
              <p class="note-matiere">{{ note.matiere?.name }}</p>
            </div>
            <div class="note-score">{{ note.note }}/20</div>
          </div>
        </div>
      </section>

      <!-- Actions Rapides -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">⚡</span>
            Actions Rapides
          </h2>
        </div>

        <div class="actions-grid">
          <router-link to="/lessons" class="action-card">
            <div class="action-icon" style="background: linear-gradient(135deg, #0052cc 0%, #0747a6 100%)">
              📚
            </div>
            <h3>Accéder aux Leçons</h3>
            <p>Consulter les supports de cours</p>
          </router-link>

          <router-link to="/student/evaluations" class="action-card">
            <div class="action-icon" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%)">
              📝
            </div>
            <h3>Mes Évaluations</h3>
            <p>Passer les évaluations en ligne</p>
          </router-link>

          <router-link to="/quizzes" class="action-card">
            <div class="action-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%)">
              ✅
            </div>
            <h3>Passer les Quiz</h3>
            <p>Quiz interactifs</p>
          </router-link>

          <router-link to="/forum" class="action-card">
            <div class="action-icon" style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%)">
              💬
            </div>
            <h3>Poser une Question</h3>
            <p>Échanger avec la communauté</p>
          </router-link>
        </div>
      </section>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'

export default {
  name: 'StudentDashboardModern',

  components: {
    DashboardLayout,
    StatCard
  },

  data() {
    return {
      user: null,
      dashboardData: null,
      loading: false,
      error: null
    }
  },

  methods: {
    async loadDashboard() {
      this.loading = true
      this.error = null

      try {
        console.log('📊 Chargement dashboard étudiant depuis KLASSCI...')
        this.dashboardData = await klassciService.getStudentDashboard()
        console.log('✅ Dashboard chargé:', this.dashboardData)

        if (this.dashboardData) {
          console.log('📚 Classe:', this.dashboardData.classe)
          console.log('📖 Cours:', this.dashboardData.cours)
          console.log('📝 Quiz:', this.dashboardData.quiz)
          console.log('📊 Stats:', this.dashboardData.statistiques)
        }
      } catch (err) {
        console.error('❌ Erreur chargement dashboard:', err)
        this.error = 'Impossible de charger vos données. Veuillez réessayer.'
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

    navigateToMatiere(cours) {
      const matiereId = cours.id || cours.matiere_id || cours.matiere?.id
      if (matiereId) {
        console.log('📚 Navigation vers matière:', matiereId)
        this.$router.push({
          name: 'matiere-details',
          params: { id: matiereId }
        })
      } else {
        console.error('❌ ID matière non trouvé:', cours)
        alert('Impossible de naviguer vers cette matière')
      }
    }
  },

  mounted() {
    this.user = auth.getUser()
    console.log('👤 Student User:', this.user)
    this.loadDashboard()
  }
}
</script>

<style scoped>
/* Page Header */
.page-header {
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: var(--font-size-4xl);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
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

/* Alert */
.alert {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.alert-error {
  background: var(--error-bg);
  border: 1px solid var(--error-border);
  color: var(--error-text);
}

.alert-icon {
  font-size: 1.5rem;
}

/* Classe Card */
.classe-card {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  margin-bottom: var(--spacing-xl);
}

.classe-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.classe-icon {
  font-size: 3rem;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--blue-600) 100%);
  border-radius: var(--radius-lg);
}

.classe-name {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.classe-details {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

/* Sections */
.section {
  margin-bottom: var(--spacing-2xl);
}

.section-header {
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
}

.section-icon {
  font-size: 1.75rem;
}

/* Cours Grid */
.cours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.cours-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--card-shadow);
}

.cours-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
}

.cours-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.cours-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--blue-600) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.cours-badge {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.cours-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

.btn-primary {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-primary:hover {
  background: var(--btn-primary-hover);
  transform: scale(1.02);
}

/* Quiz List */
.quiz-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.quiz-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-fast);
}

.quiz-card:hover {
  box-shadow: var(--card-shadow);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.quiz-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.quiz-matiere {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
}

.quiz-date {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
}

/* Badges */
.badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}

.badge-success {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
}

.badge-info {
  background: var(--info-bg);
  color: var(--info-text);
  border: 1px solid var(--info-border);
}

.badge-neutral {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

/* Notes List */
.notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.note-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
}

.note-title {
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.note-matiere {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.note-score {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--blue-600);
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  text-decoration: none;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: var(--card-shadow);
}

.action-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
}

.action-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: var(--spacing-lg);
}

.action-card h3 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.action-card p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

/* Empty State */
.empty-state {
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: var(--font-size-2xl);
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }

  .cours-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
