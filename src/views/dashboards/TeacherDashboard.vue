<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div class="welcome-header">
        <UserIcon class="welcome-icon" />
        <div>
          <h1 class="page-title">Dashboard Enseignant</h1>
          <p class="page-subtitle">
            Bienvenue, <strong>{{ user?.name }}</strong>
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading">
        <!-- Skeleton for stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>

        <!-- Skeleton for matières -->
        <div class="widget-card mb-6">
          <SkeletonLoader type="text" width="150px" />
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
          </div>
        </div>

        <!-- Skeleton for classes -->
        <div class="widget-card mb-6">
          <SkeletonLoader type="text" width="150px" />
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
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
      <div v-if="!loading && !error && dashboardData">
        <!-- Statistiques Principales -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="stat-card">
            <div class="stat-header">
              <BookOpenIcon class="stat-icon text-blue-600" />
              <p class="stat-label">Matières Enseignées</p>
            </div>
            <p class="stat-value text-blue-600">
              {{ dashboardData.matieres?.length || 0 }}
            </p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <UserGroupIcon class="stat-icon text-green-600" />
              <p class="stat-label">Classes</p>
            </div>
            <p class="stat-value text-green-600">
              {{ dashboardData.classes?.length || 0 }}
            </p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <DocumentTextIcon class="stat-icon text-orange-600" />
              <p class="stat-label">Évaluations</p>
            </div>
            <p class="stat-value text-orange-600">
              {{ dashboardData.evaluations?.length || 0 }}
            </p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <CalendarIcon class="stat-icon text-purple-600" />
              <p class="stat-label">Séances à venir</p>
            </div>
            <p class="stat-value text-purple-600">
              {{ dashboardData.seances?.length || 0 }}
            </p>
          </div>
        </div>

        <!-- Widgets Performance et Activité -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Widget Activité Récente -->
          <div class="widget-card">
            <div class="widget-header">
              <ChartBarIcon class="widget-icon text-indigo-600" />
              <h2 class="widget-title">Activité Récente</h2>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <p class="stat-label">Étudiants Totaux</p>
                <p class="stat-value text-indigo-600">
                  {{ dashboardData.statistiques?.total_etudiants || 0 }}
                </p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Leçons Créées</p>
                <p class="stat-value text-blue-600">
                  {{ dashboardData.statistiques?.total_lecons || dashboardData.lessons?.length || 0 }}
                </p>
              </div>
            </div>
          </div>

          <!-- Widget Prochaines Séances -->
          <div class="widget-card">
            <div class="widget-header">
              <CalendarIcon class="widget-icon text-purple-600" />
              <h2 class="widget-title">Aujourd'hui</h2>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <p class="stat-label">Séances du Jour</p>
                <p class="stat-value text-purple-600">
                  {{ dashboardData.statistiques?.seances_aujourdhui || 0 }}
                </p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Évaluations en Cours</p>
                <p class="stat-value text-orange-600">
                  {{ dashboardData.statistiques?.evaluations_en_cours || 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Mes Matières -->
        <div class="widget-card mb-6">
          <div class="widget-header">
            <BookOpenIcon class="widget-icon text-blue-600" />
            <h2 class="widget-title">Mes Matières</h2>
          </div>
          <div v-if="dashboardData.matieres && dashboardData.matieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="matiere in dashboardData.matieres"
              :key="matiere.id || matiere.matiere_id"
              class="course-card"
              @click="navigateToMatiere(matiere)"
              @keydown.enter="navigateToMatiere(matiere)"
              @keydown.space.prevent="navigateToMatiere(matiere)"
              role="button"
              tabindex="0"
            >
              <h3 class="course-title">
                {{ matiere.name || matiere.nom || matiere.libelle || 'Matière sans nom' }}
              </h3>
              <p v-if="matiere.coefficient" class="course-info">
                Coefficient: {{ matiere.coefficient }}
              </p>

              <button
                @click.stop="navigateToMatiere(matiere)"
                class="course-btn"
              >
                <BookOpenIcon class="w-5 h-5" />
                Gérer la matière
              </button>
            </div>
          </div>
          <div v-else class="empty-state-inline">
            <p class="empty-message">Aucune matière assignée</p>
          </div>
        </div>

        <!-- Mes Classes -->
        <div class="widget-card mb-6">
          <div class="widget-header">
            <UserGroupIcon class="widget-icon text-green-600" />
            <h2 class="widget-title">Mes Classes</h2>
          </div>
          <div v-if="dashboardData.classes && dashboardData.classes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="classe in dashboardData.classes"
              :key="classe.id"
              class="course-card"
            >
              <h3 class="course-title">{{ classe.name || classe.libelle }}</h3>
              <p v-if="classe.filiere" class="course-info mb-1">
                Filière: {{ classe.filiere.name || classe.filiere.nom }}
              </p>
              <p v-if="classe.niveau" class="course-info">
                Niveau: {{ classe.niveau.name || classe.niveau.nom }}
              </p>
            </div>
          </div>
          <div v-else class="empty-state-inline">
            <p class="empty-message">Aucune classe assignée</p>
          </div>
        </div>

        <!-- Évaluations à venir -->
        <div v-if="dashboardData.evaluations && dashboardData.evaluations.length > 0" class="widget-card mb-6">
          <div class="widget-header">
            <DocumentTextIcon class="widget-icon text-orange-600" />
            <h2 class="widget-title">Évaluations à venir</h2>
          </div>
          <div class="space-y-3">
            <div
              v-for="evaluation in dashboardData.evaluations"
              :key="evaluation.id"
              class="evaluation-item"
            >
              <div class="evaluation-info">
                <h3 class="evaluation-title">{{ evaluation.titre || evaluation.name }}</h3>
                <p class="evaluation-meta">{{ evaluation.matiere?.name || evaluation.classe?.name }}</p>
                <p class="evaluation-date">Date: {{ formatDate(evaluation.date) }}</p>
              </div>
              <span
                :class="{
                  'badge-success': evaluation.statut === 'planifie',
                  'badge-info': evaluation.statut === 'en_cours',
                  'badge-default': evaluation.statut === 'termine'
                }"
                class="evaluation-badge"
              >
                {{ evaluation.statut }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions Rapides -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <router-link
            to="/teacher/lessons"
            class="action-card"
          >
            <BookOpenIcon class="action-icon text-blue-600" />
            <h3 class="action-title">Gérer mes Leçons</h3>
            <p class="action-description">Créer et modifier les cours</p>
          </router-link>

          <router-link
            to="/teacher/evaluations"
            class="action-card"
          >
            <DocumentTextIcon class="action-icon text-orange-600" />
            <h3 class="action-title">Mes Évaluations</h3>
            <p class="action-description">Gérer les évaluations en ligne</p>
          </router-link>

          <router-link
            to="/teacher/seances"
            class="action-card"
          >
            <CalendarIcon class="action-icon text-purple-600" />
            <h3 class="action-title">Mes Séances</h3>
            <p class="action-description">Gérer les séances de cours</p>
          </router-link>

          <router-link
            to="/teacher/stats"
            class="action-card"
          >
            <ChartBarIcon class="action-icon text-green-600" />
            <h3 class="action-title">Statistiques</h3>
            <p class="action-description">Voir mes performances</p>
          </router-link>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import {
  UserIcon,
  BookOpenIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

const user = ref(null)
const dashboardData = ref(null)
const loading = ref(false)
const error = ref(null)

const CACHE_KEY = 'teacher_dashboard_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function loadDashboard(forceRefresh = false) {
  // Vérifier le cache si pas de force refresh
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('📦 Dashboard enseignant chargé depuis le cache')
          dashboardData.value = data
          return
        }
      } catch (err) {
        console.warn('⚠ Cache invalide, rechargement...')
      }
    }
  }

  loading.value = true
  error.value = null

  try {
    console.log('📊 Chargement dashboard enseignant depuis KLASSCI...')
    const data = await klassciService.getTeacherDashboard()
    dashboardData.value = data

    // Mettre en cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))

    console.log('✅ Dashboard chargé:', data)

    // Logs détaillés pour debug
    if (data) {
      console.log('📚 Matières:', data.matieres)
      console.log('🏫 Classes:', data.classes)
      console.log('📝 Évaluations:', data.evaluations)
      console.log('📊 Stats:', data.statistiques)
    }
  } catch (err) {
    console.error('❌ Erreur chargement dashboard:', err)
    error.value = 'Impossible de charger vos données. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function navigateToMatiere(matiere) {
  console.log('🔍 Structure matière reçue:', matiere)

  // Essayer différentes propriétés
  const matiereId = matiere.matiere_id || matiere.id || matiere.matiere?.id

  if (matiereId) {
    console.log('📚 Navigation vers matière:', matiereId)
    router.push({
      name: 'matiere-details',
      params: { id: matiereId }
    })
  } else {
    console.error('❌ ID matière non trouvé:', matiere)
    error.value = 'Impossible de naviguer vers cette matière'
  }
}

onMounted(() => {
  user.value = auth.getUser()
  console.log('👤 Teacher User:', user.value)

  // Charger le dashboard KLASSCI
  loadDashboard()
})
</script>

<style scoped>
.dashboard-content {
  padding: 2rem;
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
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

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-content {
  margin-bottom: 2rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--text-secondary);
}

.error-retry-btn {
  padding: 0.75rem 2rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
}

/* Stat cards */
.stat-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* Widget card */
.widget-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.stat-item .stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-item .stat-value {
  font-size: 2rem;
  font-weight: 700;
}

/* Course card */
.course-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-card:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.course-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.course-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.course-btn:hover {
  background: var(--color-primary-dark);
}

/* Empty state inline */
.empty-state-inline {
  padding: 2rem;
  text-align: center;
}

.empty-message {
  color: var(--text-secondary);
}

/* Evaluation item */
.evaluation-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.evaluation-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.evaluation-info {
  flex: 1;
}

.evaluation-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.evaluation-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.evaluation-date {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.evaluation-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-success {
  background: #dcfce7;
  color: #166534;
}

.badge-info {
  background: #dbeafe;
  color: #1e40af;
}

.badge-default {
  background: #f3f4f6;
  color: #4b5563;
}

/* Action card */
.action-card {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
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

/* Responsive */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
