<template>
  <DashboardLayout>
    <div class="stats-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Statistiques</h1>
          <p class="page-subtitle">Consultez vos statistiques personnelles et performances</p>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des statistiques..." />

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadStats" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Stats Content -->
      <div v-if="!loading && !error && stats">
        <!-- Statistiques Globales -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="stat-card">
            <div class="stat-icon-wrapper bg-blue-100">
              <BookOpenIcon class="stat-icon text-blue-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Matières Enseignées</p>
              <p class="stat-value">{{ stats.nb_matieres || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-green-100">
              <UserGroupIcon class="stat-icon text-green-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Total Étudiants</p>
              <p class="stat-value">{{ stats.nb_etudiants || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-orange-100">
              <DocumentTextIcon class="stat-icon text-orange-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Évaluations Créées</p>
              <p class="stat-value">{{ stats.nb_evaluations || 0 }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-purple-100">
              <CalendarIcon class="stat-icon text-purple-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Séances Données</p>
              <p class="stat-value">{{ stats.nb_seances || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Grilles Détaillées -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Widget Performance par Matière -->
          <div class="widget-card">
            <div class="widget-header">
              <ChartBarIcon class="widget-icon text-indigo-600" />
              <h2 class="widget-title">Performance par Matière</h2>
            </div>
            <div v-if="stats.par_matiere && stats.par_matiere.length > 0" class="space-y-3">
              <div
                v-for="matiere in stats.par_matiere"
                :key="matiere.id"
                class="matiere-stat-item"
              >
                <div class="matiere-info">
                  <p class="matiere-name">{{ matiere.nom }}</p>
                  <p class="matiere-detail">{{ matiere.nb_classes || 0 }} classe(s)</p>
                </div>
                <div class="matiere-stats">
                  <div class="mini-stat">
                    <span class="mini-stat-value">{{ matiere.nb_etudiants || 0 }}</span>
                    <span class="mini-stat-label">étudiants</span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-stat-value">{{ matiere.nb_evaluations || 0 }}</span>
                    <span class="mini-stat-label">éval.</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <p class="empty-message">Aucune donnée disponible</p>
            </div>
          </div>

          <!-- Widget Activité Récente -->
          <div class="widget-card">
            <div class="widget-header">
              <ClockIcon class="widget-icon text-blue-600" />
              <h2 class="widget-title">Activité Récente</h2>
            </div>
            <div class="activity-grid">
              <div class="activity-item">
                <div class="activity-icon-wrapper bg-blue-100">
                  <AcademicCapIcon class="activity-icon text-blue-600" />
                </div>
                <div>
                  <p class="activity-label">Leçons Créées</p>
                  <p class="activity-value">{{ stats.nb_lecons || 0 }}</p>
                </div>
              </div>

              <div class="activity-item">
                <div class="activity-icon-wrapper bg-green-100">
                  <CheckCircleIcon class="activity-icon text-green-600" />
                </div>
                <div>
                  <p class="activity-label">Corrections Effectuées</p>
                  <p class="activity-value">{{ stats.nb_corrections || 0 }}</p>
                </div>
              </div>

              <div class="activity-item">
                <div class="activity-icon-wrapper bg-purple-100">
                  <VideoCameraIcon class="activity-icon text-purple-600" />
                </div>
                <div>
                  <p class="activity-label">Visioconférences</p>
                  <p class="activity-value">{{ stats.nb_visio || 0 }}</p>
                </div>
              </div>

              <div class="activity-item">
                <div class="activity-icon-wrapper bg-orange-100">
                  <ChatBubbleLeftRightIcon class="activity-icon text-orange-600" />
                </div>
                <div>
                  <p class="activity-label">Messages Forum</p>
                  <p class="activity-value">{{ stats.nb_messages_forum || 0 }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Widget Classes -->
        <div class="widget-card mb-6">
          <div class="widget-header">
            <BuildingLibraryIcon class="widget-icon text-green-600" />
            <h2 class="widget-title">Répartition par Classe</h2>
          </div>
          <div v-if="stats.par_classe && stats.par_classe.length > 0" class="classes-grid">
            <div
              v-for="classe in stats.par_classe"
              :key="classe.id"
              class="classe-stat-card"
            >
              <div class="classe-header">
                <h3 class="classe-name">{{ classe.nom }}</h3>
                <span class="classe-badge">{{ classe.niveau }}</span>
              </div>
              <div class="classe-stats-row">
                <div class="classe-stat">
                  <UserGroupIcon class="w-4 h-4 text-gray-500" />
                  <span>{{ classe.nb_etudiants || 0 }} étudiants</span>
                </div>
                <div class="classe-stat">
                  <BookOpenIcon class="w-4 h-4 text-gray-500" />
                  <span>{{ classe.nb_matieres || 0 }} matières</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state-small">
            <p class="empty-message">Aucune classe assignée</p>
          </div>
        </div>

        <!-- Actions Rapides -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <router-link to="/teacher/dashboard" class="action-card">
            <ChartBarIcon class="action-icon text-blue-600" />
            <h3 class="action-title">Dashboard</h3>
            <p class="action-description">Retour au tableau de bord</p>
          </router-link>

          <router-link to="/teacher/evaluations" class="action-card">
            <DocumentTextIcon class="action-icon text-orange-600" />
            <h3 class="action-title">Évaluations</h3>
            <p class="action-description">Gérer mes évaluations</p>
          </router-link>

          <router-link to="/teacher/classes" class="action-card">
            <UserGroupIcon class="action-icon text-green-600" />
            <h3 class="action-title">Mes Classes</h3>
            <p class="action-description">Consulter mes classes</p>
          </router-link>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
import {
  ChartBarIcon,
  BookOpenIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon
} from '@heroicons/vue/24/outline'

const stats = ref(null)
const loading = ref(false)
const error = ref(null)

async function loadStats() {
  // Vérifier le cache
  const cachedData = readCache('teacher_stats')
  if (cachedData !== null) {
    console.log('[CACHE] Stats chargées depuis le cache')
    stats.value = cachedData
    loading.value = false
    // Rafraîchir en arrière-plan
    refreshInBackground()
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('[STATS] Chargement des statistiques enseignant...')
    const dashboardData = await klassciService.getTeacherDashboard()

    // Construire l'objet stats à partir du dashboard
    stats.value = {
      nb_matieres: dashboardData.matieres?.length || 0,
      nb_etudiants: dashboardData.statistiques?.total_etudiants || 0,
      nb_evaluations: dashboardData.evaluations?.length || 0,
      nb_seances: dashboardData.seances?.length || 0,
      nb_lecons: dashboardData.statistiques?.total_lecons || dashboardData.lessons?.length || 0,
      nb_corrections: dashboardData.statistiques?.corrections_effectuees || 0,
      nb_visio: dashboardData.statistiques?.visio_effectuees || 0,
      nb_messages_forum: dashboardData.statistiques?.messages_forum || 0,
      par_matiere: dashboardData.matieres || [],
      par_classe: dashboardData.classes || []
    }

    // Mettre en cache
    writeCache('teacher_stats', stats.value)

    console.log('[OK] Statistiques chargées:', stats.value)
  } catch (err) {
    console.error('[ERREUR] Erreur chargement statistiques:', err)
    error.value = 'Impossible de charger vos statistiques. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

async function refreshInBackground() {
  try {
    console.log('[BACKGROUND] Rafraîchissement des stats...')
    const dashboardData = await klassciService.getTeacherDashboard()

    stats.value = {
      nb_matieres: dashboardData.matieres?.length || 0,
      nb_etudiants: dashboardData.statistiques?.total_etudiants || 0,
      nb_evaluations: dashboardData.evaluations?.length || 0,
      nb_seances: dashboardData.seances?.length || 0,
      nb_lecons: dashboardData.statistiques?.total_lecons || dashboardData.lessons?.length || 0,
      nb_corrections: dashboardData.statistiques?.corrections_effectuees || 0,
      nb_visio: dashboardData.statistiques?.visio_effectuees || 0,
      nb_messages_forum: dashboardData.statistiques?.messages_forum || 0,
      par_matiere: dashboardData.matieres || [],
      par_classe: dashboardData.classes || []
    }

    writeCache('teacher_stats', stats.value)

    console.log('[BACKGROUND] Stats rafraîchies')
  } catch (error) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-container {
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

/* Stat Cards */
.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.stat-icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-blue-100 {
  background: #dbeafe;
}

.bg-green-100 {
  background: #dcfce7;
}

.bg-orange-100 {
  background: #ffedd5;
}

.bg-purple-100 {
  background: #f3e8ff;
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Widget Card */
.widget-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
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

/* Matiere Stats */
.matiere-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.matiere-stat-item:hover {
  background: var(--bg-tertiary);
}

.matiere-info {
  flex: 1;
}

.matiere-name {
  font-size: 0.938rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.matiere-detail {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.matiere-stats {
  display: flex;
  gap: 1.5rem;
}

.mini-stat {
  text-align: center;
}

.mini-stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.mini-stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Activity Grid */
.activity-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.activity-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.activity-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.activity-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Classes Grid */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.classe-stat-card {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.classe-stat-card:hover {
  background: var(--bg-tertiary);
}

.classe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.classe-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.classe-badge {
  padding: 0.25rem 0.5rem;
  background: #e0e7ff;
  color: #5b21b6;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.classe-stats-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.classe-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Action Cards */
.action-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.action-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
}

.action-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
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

/* Empty State Small */
.empty-state-small {
  text-align: center;
  padding: 2rem;
}

.empty-message {
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

@media (max-width: 768px) {
  .activity-grid {
    grid-template-columns: 1fr;
  }

  .classes-grid {
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
