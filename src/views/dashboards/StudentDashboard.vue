<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div class="welcome-header">
        <AcademicCapIcon class="welcome-icon" />
        <div>
          <h1 class="page-title">Dashboard Étudiant</h1>
          <p class="page-subtitle">
            Bienvenue, <strong>{{ user?.name || user?.nom + ' ' + user?.prenom }}</strong>
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading">
        <!-- Skeleton for widgets -->
        <div class="widget-card mb-6">
          <div class="widget-header">
            <SkeletonLoader type="circle" width="1.5rem" height="1.5rem" />
            <SkeletonLoader type="text" width="120px" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonLoader type="rect" height="60px" />
            <SkeletonLoader type="rect" height="60px" />
            <SkeletonLoader type="rect" height="60px" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>

        <div class="widget-card mb-6">
          <SkeletonLoader type="text" width="150px" />
          <div class="space-y-3 mt-4">
            <SkeletonLoader type="rect" height="60px" />
            <SkeletonLoader type="rect" height="60px" />
            <SkeletonLoader type="rect" height="60px" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon">⚠</div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadDashboard(true)" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Dashboard Content -->
      <div v-if="!loading && dashboardData">
        <!-- Widget Profil (Classe, Filière, Niveau) -->
        <div class="widget-card mb-6">
          <div class="widget-header">
            <BuildingLibraryIcon class="widget-icon text-blue-600" />
            <h2 class="widget-title">Mon Profil</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4" v-if="dashboardData.classe">
            <div class="info-item">
              <p class="info-label">Classe</p>
              <p class="info-value">{{ dashboardData.classe.name || dashboardData.classe.libelle || 'N/A' }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">Filière</p>
              <p class="info-value">{{ dashboardData.classe.filiere?.name || dashboardData.classe.filiere?.nom || dashboardData.classe.filiere?.libelle || 'N/A' }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">Niveau</p>
              <p class="info-value">{{ dashboardData.classe.niveau?.name || dashboardData.classe.niveau?.nom || dashboardData.classe.niveau?.libelle || 'N/A' }}</p>
            </div>
          </div>
          <p v-else class="text-gray-500">Aucune classe assignée</p>
        </div>

        <!-- Widgets Performance et Activité -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Widget Performance -->
          <div class="widget-card">
            <div class="widget-header">
              <ChartBarIcon class="widget-icon text-green-600" />
              <h2 class="widget-title">Performance</h2>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <p class="stat-label">Moyenne Générale</p>
                <p class="stat-value text-blue-600">
                  {{ dashboardData.statistiques?.moyenne_generale || 'N/A' }}
                </p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Taux de Présence</p>
                <p class="stat-value text-green-600">
                  {{ dashboardData.statistiques?.taux_presence || '0' }}%
                </p>
              </div>
            </div>
          </div>

          <!-- Widget Activité -->
          <div class="widget-card">
            <div class="widget-header">
              <BookOpenIcon class="widget-icon text-purple-600" />
              <h2 class="widget-title">Activité</h2>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <p class="stat-label">Cours Suivis</p>
                <p class="stat-value text-purple-600">
                  {{ dashboardData.cours?.length || 0 }}
                </p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Évaluations Effectuées</p>
                <p class="stat-value text-orange-600">
                  {{ dashboardData.quiz?.length || 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Widget Notes Récentes -->
        <div class="widget-card mb-6" v-if="dashboardData.notes && dashboardData.notes.length > 0">
          <div class="widget-header">
            <DocumentTextIcon class="widget-icon text-indigo-600" />
            <h2 class="widget-title">Notes Récentes</h2>
          </div>
          <div class="space-y-3">
            <div
              v-for="note in dashboardData.notes.slice(0, 5)"
              :key="note.id"
              class="note-item"
            >
              <div class="note-info">
                <p class="note-title">{{ note.evaluation?.titre || 'Évaluation' }}</p>
                <p class="note-matiere">{{ note.matiere?.name || 'Matière inconnue' }}</p>
              </div>
              <div class="note-score">
                <p class="text-2xl font-bold text-blue-600">{{ note.note }}/20</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Rapides -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <router-link
            :to="{ name: 'student-courses' }"
            class="action-card"
            aria-label="Accéder à la page Mes Cours"
          >
            <BookOpenIcon class="action-icon text-blue-600" aria-hidden="true" />
            <h3 class="action-title">Mes Cours</h3>
            <p class="action-description">Accéder à tous mes cours</p>
          </router-link>

          <router-link
            :to="{ name: 'student-evaluations-list' }"
            class="action-card"
            aria-label="Accéder à la page Évaluations"
          >
            <DocumentTextIcon class="action-icon text-orange-600" aria-hidden="true" />
            <h3 class="action-title">Évaluations</h3>
            <p class="action-description">Voir toutes mes évaluations</p>
          </router-link>

          <router-link
            :to="{ name: 'student-schedule', query: { filter: 'visio' } }"
            class="action-card"
            aria-label="Accéder à la page Visioconférences"
          >
            <VideoCameraIcon class="action-icon text-purple-600" aria-hidden="true" />
            <h3 class="action-title">Visioconférences</h3>
            <p class="action-description">Mes séances en ligne</p>
          </router-link>

          <router-link
            to="/forum"
            class="action-card"
            aria-label="Accéder au Forum"
          >
            <ChatBubbleLeftRightIcon class="action-icon text-green-600" aria-hidden="true" />
            <h3 class="action-title">Forum</h3>
            <p class="action-description">Poser une question</p>
          </router-link>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import {
  AcademicCapIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  CheckCircleIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'StudentDashboard',
  components: {
    DashboardLayout,
    SkeletonLoader,
    AcademicCapIcon,
    BookOpenIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    BuildingLibraryIcon,
    ChartBarIcon,
    CheckCircleIcon,
    VideoCameraIcon
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
    loadCachedData() {
      try {
        const cached = localStorage.getItem('student_dashboard_cache')
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          // Cache valide pour 5 minutes
          const isValid = Date.now() - timestamp < 5 * 60 * 1000
          if (isValid) {
            console.log('[CACHE] Données chargées depuis le cache')
            this.dashboardData = data
            return true
          }
        }
      } catch (error) {
        console.warn('[CACHE] Erreur lecture cache:', error)
      }
      return false
    },

    saveCacheData(data) {
      try {
        const cacheData = {
          data,
          timestamp: Date.now()
        }
        localStorage.setItem('student_dashboard_cache', JSON.stringify(cacheData))
        console.log('[CACHE] Données sauvegardées dans le cache')
      } catch (error) {
        console.warn('[CACHE] Erreur sauvegarde cache:', error)
      }
    },

    async loadDashboard(forceRefresh = false) {
      // Charger depuis le cache si disponible et pas de refresh forcé
      if (!forceRefresh && this.loadCachedData()) {
        this.loading = false
        // Charger les nouvelles données en arrière-plan
        this.refreshInBackground()
        return
      }

      this.loading = true
      this.error = null

      try {
        console.log('[DASHBOARD] Chargement dashboard étudiant...')
        this.dashboardData = await klassciService.getStudentDashboard()
        console.log('[OK] Dashboard chargé:', this.dashboardData)

        // Sauvegarder dans le cache
        this.saveCacheData(this.dashboardData)
      } catch (err) {
        console.error('[ERREUR] Erreur chargement dashboard:', err)
        this.error = 'Impossible de charger vos données. Veuillez réessayer.'
      } finally {
        this.loading = false
      }
    },

    async refreshInBackground() {
      try {
        console.log('[BACKGROUND] Rafraîchissement des données...')
        const freshData = await klassciService.getStudentDashboard()
        this.dashboardData = freshData
        this.saveCacheData(freshData)
        console.log('[BACKGROUND] Données rafraîchies')
      } catch (error) {
        console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
      }
    }
  },
  mounted() {
    this.user = auth.getUser()
    console.log('[USER] Student User:', this.user)
    this.loadDashboard()
  }
}
</script>

<style scoped>
.dashboard-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Welcome Header */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--blue-600);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Widget Card */
.widget-card {
  background-color: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.widget-card:hover {
  box-shadow: var(--card-hover-shadow);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Info Items */
.info-item {
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
}

/* Note Items */
.note-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.note-item:hover {
  background: var(--bg-tertiary);
}

.note-info {
  flex: 1;
}

.note-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.note-matiere {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.note-score {
  text-align: right;
}

/* Action Cards */
.action-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  transition: all 0.2s;
  text-decoration: none;
  display: block;
}

.action-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
}

.action-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.75rem;
}

.action-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.action-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
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

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
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
