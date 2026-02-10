<template>
  <DashboardLayout>
    <div class="admin-stats-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <ChartBarIcon class="page-icon" />
          <div>
            <h1 class="page-title">Statistiques</h1>
            <p class="page-subtitle">Vue d'ensemble des statistiques de la plateforme</p>
          </div>
        </div>
        <button @click="refreshData" class="refresh-btn" title="Actualiser les données">
          <ArrowPathIcon :class="['w-5 h-5', { 'animate-spin': loading }]" />
        </button>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des statistiques..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <ExclamationTriangleIcon class="error-icon" />
        <p class="error-message">⚠ {{ error }}</p>
        <button @click="loadStats" class="retry-btn">Réessayer</button>
      </div>

      <!-- Stats Content -->
      <div v-else>
        <!-- Main Stats Grid -->
        <div class="stats-grid-main">
          <!-- Utilisateurs -->
          <div class="stat-card-large blue">
            <div class="stat-header">
              <UserGroupIcon class="stat-icon" />
              <h3 class="stat-title">Utilisateurs</h3>
            </div>
            <div class="stat-body">
              <div class="stat-row">
                <span class="stat-label">Enseignants</span>
                <span class="stat-value">{{ stats.nb_enseignants || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Étudiants</span>
                <span class="stat-value">{{ stats.nb_etudiants || 0 }}</span>
              </div>
              <div class="stat-row total">
                <span class="stat-label">Total</span>
                <span class="stat-value">{{ (stats.nb_enseignants || 0) + (stats.nb_etudiants || 0) }}</span>
              </div>
            </div>
          </div>

          <!-- Classes & Matières -->
          <div class="stat-card-large purple">
            <div class="stat-header">
              <BuildingLibraryIcon class="stat-icon" />
              <h3 class="stat-title">Classes & Matières</h3>
            </div>
            <div class="stat-body">
              <div class="stat-row">
                <span class="stat-label">Classes actives</span>
                <span class="stat-value">{{ stats.nb_classes_actives || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Matières actives</span>
                <span class="stat-value">{{ stats.nb_matieres_actives || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Filières</span>
                <span class="stat-value">{{ stats.nb_filieres || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Niveaux</span>
                <span class="stat-value">{{ stats.nb_niveaux || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Séances & Visio -->
          <div class="stat-card-large green">
            <div class="stat-header">
              <CalendarIcon class="stat-icon" />
              <h3 class="stat-title">Séances & Visioconférences</h3>
            </div>
            <div class="stat-body">
              <div class="stat-row">
                <span class="stat-label">Séances actives</span>
                <span class="stat-value">{{ stats.nb_seances_actives || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Visios en cours</span>
                <span class="stat-value">{{ stats.nb_visios_actives || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Visios planifiées</span>
                <span class="stat-value">{{ stats.nb_visios_scheduled || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Évaluations -->
          <div class="stat-card-large orange">
            <div class="stat-header">
              <DocumentTextIcon class="stat-icon" />
              <h3 class="stat-title">Évaluations</h3>
            </div>
            <div class="stat-body">
              <div class="stat-row">
                <span class="stat-label">Total évaluations</span>
                <span class="stat-value">{{ stats.nb_evaluations || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">En cours</span>
                <span class="stat-value">{{ stats.nb_evaluations_actives || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Terminées</span>
                <span class="stat-value">{{ stats.nb_evaluations_terminees || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Année universitaire -->
        <div v-if="meta?.annee_universitaire_courante" class="info-card">
          <CalendarIcon class="info-icon" />
          <div class="info-content">
            <h3 class="info-title">Année Universitaire</h3>
            <p class="info-text">{{ meta.annee_universitaire_courante.nom || 'Non définie' }}</p>
          </div>
        </div>

        <!-- Stats supplémentaires -->
        <div class="stats-grid-secondary">
          <div class="stat-card-small">
            <BookOpenIcon class="stat-card-icon" />
            <div class="stat-card-content">
              <p class="stat-card-label">Leçons créées</p>
              <p class="stat-card-value">{{ stats.nb_lessons || 0 }}</p>
            </div>
          </div>

          <div class="stat-card-small">
            <ChatBubbleLeftRightIcon class="stat-card-icon" />
            <div class="stat-card-content">
              <p class="stat-card-label">Discussions actives</p>
              <p class="stat-card-value">{{ stats.nb_forum_topics || 0 }}</p>
            </div>
          </div>

          <div class="stat-card-small">
            <ClockIcon class="stat-card-icon" />
            <div class="stat-card-content">
              <p class="stat-card-label">Heures de cours</p>
              <p class="stat-card-value">{{ stats.nb_heures_cours || 0 }}</p>
            </div>
          </div>

          <div class="stat-card-small">
            <CheckCircleIcon class="stat-card-icon" />
            <div class="stat-card-content">
              <p class="stat-card-label">Taux de présence</p>
              <p class="stat-card-value">{{ stats.taux_presence || 0 }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { auth } from '@/services/api'
import {
  ChartBarIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const loading = ref(true)
const error = ref(null)
const stats = ref({})
const meta = ref(null)

const CACHE_KEY = 'admin_stats_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function loadStats() {
  loading.value = true
  error.value = null

  try {
    // Tenter de charger depuis le cache
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, metaData, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('[CACHE] Statistiques admin chargées depuis le cache')
          stats.value = data
          meta.value = metaData
          loading.value = false
          refreshInBackground()
          return
        }
      } catch (err) {
        console.warn('[CACHE] Cache invalide, rechargement...')
      }
    }

    // Charger depuis l'auth service (données synchronisées lors du login)
    const user = auth.getUser()
    meta.value = auth.getMeta()

    if (user?.admin_data?.statistics) {
      stats.value = user.admin_data.statistics
    } else {
      // Fallback: charger depuis un endpoint si disponible
      stats.value = {
        nb_enseignants: 0,
        nb_etudiants: 0,
        nb_classes_actives: 0,
        nb_matieres_actives: 0,
        nb_filieres: 0,
        nb_niveaux: 0,
        nb_seances_actives: 0,
        nb_visios_actives: 0,
        nb_visios_scheduled: 0,
        nb_evaluations: 0,
        nb_evaluations_actives: 0,
        nb_evaluations_terminees: 0,
        nb_lessons: 0,
        nb_forum_topics: 0,
        nb_heures_cours: 0,
        taux_presence: 0
      }
    }

    // Mettre en cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: stats.value,
      metaData: meta.value,
      timestamp: Date.now()
    }))

    console.log('✅ Statistiques chargées:', stats.value)
  } catch (err) {
    console.error('❌ Erreur chargement statistiques:', err)
    error.value = err.message || 'Impossible de charger les statistiques'
  } finally {
    loading.value = false
  }
}

async function refreshInBackground() {
  try {
    const user = auth.getUser()
    const newMeta = auth.getMeta()

    if (user?.admin_data?.statistics) {
      stats.value = user.admin_data.statistics
      meta.value = newMeta

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: stats.value,
        metaData: meta.value,
        timestamp: Date.now()
      }))
      console.log('[CACHE] Statistiques rafraîchies en arrière-plan')
    }
  } catch (err) {
    console.warn('[CACHE] Erreur rafraîchissement:', err)
  }
}

function refreshData() {
  loadStats()
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-stats-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-primary);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.refresh-btn {
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.refresh-btn:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading Grid */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

/* Main Stats Grid */
.stats-grid-main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card-large {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border-left: 4px solid;
}

.stat-card-large.blue {
  border-left-color: #3b82f6;
}

.stat-card-large.purple {
  border-left-color: #8b5cf6;
}

.stat-card-large.green {
  border-left-color: #10b981;
}

.stat-card-large.orange {
  border-left-color: #f59e0b;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-secondary);
}

.stat-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.stat-row.total {
  border-top: 1px solid var(--border-color);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-md);
  font-weight: 600;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Info Card */
.info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  color: white;
}

.info-icon {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  opacity: 0.9;
}

.info-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

/* Secondary Stats Grid */
.stats-grid-secondary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card-small {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all 0.2s;
}

.stat-card-small:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-card-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.stat-card-content {
  flex: 1;
}

.stat-card-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-card-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* States */
.error-state {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.error-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto var(--spacing-lg);
  color: var(--text-tertiary);
}

.error-message {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.retry-btn {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--color-primary-dark);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-stats-container {
    padding: var(--spacing-md);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid-main,
  .stats-grid-secondary {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-card-value {
    font-size: 1.5rem;
  }
}
</style>
