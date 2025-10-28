<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div class="welcome-header">
        <ShieldCheckIcon class="welcome-icon" />
        <div>
          <h1 class="page-title">Dashboard {{ getDashboardTitle() }}</h1>
          <p class="page-subtitle">
            Bienvenue, <strong>{{ user?.name }}</strong> ({{ user?.role_display_name }})
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading.stats || loading.classes || loading.matieres">
        <!-- Skeleton for stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>

        <!-- Skeleton for classes -->
        <div class="widget-card mb-6">
          <SkeletonLoader type="text" width="150px" />
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
          </div>
        </div>

        <!-- Skeleton for matières -->
        <div class="widget-card mb-6">
          <SkeletonLoader type="text" width="150px" />
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
            <SkeletonLoader type="card" />
          </div>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-if="!loading.stats && !loading.classes && !loading.matieres">
        <!-- Statistiques Admin depuis KLASSCI -->
        <div v-if="stats" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="stat-card border-l-blue">
            <div class="stat-header">
              <UserGroupIcon class="stat-icon text-blue-600" />
              <p class="stat-label">Enseignants</p>
            </div>
            <p class="stat-value text-blue-600">
              {{ stats?.nb_enseignants || 0 }}
            </p>
          </div>

          <div class="stat-card border-l-green">
            <div class="stat-header">
              <AcademicCapIcon class="stat-icon text-green-600" />
              <p class="stat-label">Étudiants</p>
            </div>
            <p class="stat-value text-green-600">
              {{ stats?.nb_etudiants || 0 }}
            </p>
          </div>

          <div class="stat-card border-l-purple">
            <div class="stat-header">
              <BuildingLibraryIcon class="stat-icon text-purple-600" />
              <p class="stat-label">Classes actives</p>
            </div>
            <p class="stat-value text-purple-600">
              {{ stats?.nb_classes_actives || 0 }}
            </p>
          </div>

          <div class="stat-card border-l-orange">
            <div class="stat-header">
              <BookOpenIcon class="stat-icon text-orange-600" />
              <p class="stat-label">Matières</p>
            </div>
            <p class="stat-value text-orange-600">
              {{ stats?.nb_matieres_actives || 0 }}
            </p>
          </div>
        </div>

        <!-- Widget Graphe Activité (30 jours) -->
        <div v-if="activityData" class="widget-card mb-6">
          <div class="widget-header">
            <ChartBarIcon class="widget-icon text-indigo-600" />
            <h2 class="widget-title">Activité des 30 derniers jours</h2>
          </div>
          <ActivityChart :data="activityData" :height="300" />
        </div>

        <!-- Widget Tâches en Attente -->
        <div v-if="pendingTasks" class="widget-card mb-6">
          <div class="widget-header">
            <ExclamationCircleIcon class="widget-icon text-orange-600" />
            <h2 class="widget-title">Tâches en Attente</h2>
          </div>
          <div class="pending-tasks-grid">
            <div v-if="pendingTasks.pending_grading?.count > 0" class="task-item urgent">
              <div class="task-icon">
                <DocumentTextIcon class="w-5 h-5 text-red-600" />
              </div>
              <div class="task-content">
                <p class="task-count">{{ pendingTasks.pending_grading.count }}</p>
                <p class="task-label">Evaluations non notées</p>
                <p v-if="pendingTasks.pending_grading.urgent_count > 0" class="task-urgent">
                  {{ pendingTasks.pending_grading.urgent_count }} urgentes (>3j)
                </p>
              </div>
            </div>

            <div v-if="pendingTasks.inactive_users?.count > 0" class="task-item">
              <div class="task-icon">
                <ClockIcon class="w-5 h-5 text-orange-600" />
              </div>
              <div class="task-content">
                <p class="task-count">{{ pendingTasks.inactive_users.count }}</p>
                <p class="task-label">Utilisateurs inactifs (30j)</p>
              </div>
            </div>

            <div v-if="pendingTasks.unpublished_evaluations?.count > 0" class="task-item">
              <div class="task-icon">
                <DocumentTextIcon class="w-5 h-5 text-gray-600" />
              </div>
              <div class="task-content">
                <p class="task-count">{{ pendingTasks.unpublished_evaluations.count }}</p>
                <p class="task-label">Evaluations non publiées</p>
              </div>
            </div>

            <div v-if="pendingTasks.draft_lessons?.count > 0" class="task-item">
              <div class="task-icon">
                <BookOpenIcon class="w-5 h-5 text-gray-600" />
              </div>
              <div class="task-content">
                <p class="task-count">{{ pendingTasks.draft_lessons.count }}</p>
                <p class="task-label">Leçons en brouillon</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Widgets Activité et Système -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Widget Activité Système -->
          <div class="widget-card">
            <div class="widget-header">
              <ChartBarIcon class="widget-icon text-indigo-600" />
              <h2 class="widget-title">Activité Système</h2>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <p class="stat-label">Séances Actives</p>
                <p class="stat-value text-purple-600">
                  {{ stats?.nb_seances_actives || 0 }}
                </p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Évaluations Totales</p>
                <p class="stat-value text-orange-600">
                  {{ stats?.nb_evaluations || 0 }}
                </p>
              </div>
            </div>
          </div>

          <!-- Widget Gestion -->
          <div class="widget-card">
            <div class="widget-header">
              <BuildingLibraryIcon class="widget-icon text-blue-600" />
              <h2 class="widget-title">Vue d'Ensemble</h2>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <p class="stat-label">Filières</p>
                <p class="stat-value text-blue-600">
                  {{ stats?.nb_filieres || 0 }}
                </p>
              </div>
              <div class="stat-item">
                <p class="stat-label">Niveaux</p>
                <p class="stat-value text-green-600">
                  {{ stats?.nb_niveaux || 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Widget Actions Rapides -->
        <div class="widget-card mb-6">
          <div class="widget-header">
            <DocumentTextIcon class="widget-icon text-purple-600" />
            <h2 class="widget-title">Actions Rapides</h2>
          </div>
          <div class="quick-actions-grid">
            <QuickActionButton
              label="Gérer Séances & Visio"
              :icon="CalendarIcon"
              variant="primary"
              @click="navigateTo('/coordinateur/seances')"
            />
            <QuickActionButton
              label="Voir Classes"
              :icon="BuildingLibraryIcon"
              variant="success"
              @click="navigateTo('/admin/classes')"
            />
            <QuickActionButton
              label="Voir Matières"
              :icon="BookOpenIcon"
              variant="warning"
              @click="navigateTo('/admin/matieres')"
            />
            <QuickActionButton
              label="Voir Statistiques"
              :icon="ChartBarIcon"
              variant="secondary"
              @click="navigateTo('/admin/stats')"
            />
            <QuickActionButton
              label="Générer Rapport"
              :icon="DocumentArrowDownIcon"
              variant="danger"
              @click="showGenerateReportModal = true"
            />
          </div>
        </div>

        <!-- Actions Admin (Navigation) - Conditionnelles selon role -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <!-- Gestion Cours - Uniquement pour enseignants et superAdmin -->
          <router-link
            v-if="isTeacher() || isSuperAdmin()"
            to="/teacher/lessons"
            class="action-card"
          >
            <BookOpenIcon class="action-icon text-blue-600" />
            <h3 class="action-title">Gestion Cours LMS</h3>
            <p class="action-description">Créer et gérer le contenu pédagogique</p>
          </router-link>

          <!-- Quiz & Evaluations - Uniquement pour enseignants et superAdmin -->
          <router-link
            v-if="isTeacher() || isSuperAdmin()"
            to="/teacher/evaluations"
            class="action-card"
          >
            <DocumentTextIcon class="action-icon text-green-600" />
            <h3 class="action-title">Quiz & Évaluations LMS</h3>
            <p class="action-description">Créer et gérer les quiz en ligne</p>
          </router-link>

          <!-- Gestion Séances & Visio - Pour coordinateurs et superAdmin -->
          <router-link
            v-if="isCoordinateur() || isSuperAdmin()"
            to="/coordinateur/seances"
            class="action-card highlighted"
          >
            <CalendarIcon class="action-icon text-orange-600" />
            <h3 class="action-title">Gestion Séances & Visio</h3>
            <p class="action-description">Activer/désactiver les visioconférences (séances de KLASSCI)</p>
          </router-link>
        </div>

        <!-- Classes KLASSCI -->
        <div class="widget-card mb-6">
          <div class="widget-header">
            <BuildingLibraryIcon class="widget-icon text-purple-600" />
            <h2 class="widget-title">Classes KLASSCI</h2>
            <span v-if="loading.classes" class="loading-indicator">Chargement...</span>
          </div>

          <div v-if="classes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="classe in classes"
              :key="classe.id"
              class="class-card"
            >
              <div class="class-header">
                <h3 class="class-name">{{ classe.name }}</h3>
                <span class="class-niveau">
                  {{ classe.niveau?.name || 'N/A' }}
                </span>
              </div>
              <div v-if="classe.filiere" class="class-filiere">
                <span class="filiere-name">{{ classe.filiere.name }}</span> - {{ classe.filiere.code }}
              </div>
              <div class="class-footer">
                <div class="class-capacity">
                  <AcademicCapIcon class="w-4 h-4" />
                  <span>{{ classe.places_occupees || 0 }}/{{ classe.places_totales || 0 }}</span>
                </div>
                <span v-if="classe.is_active" class="active-badge">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div v-else-if="!loading.classes" class="empty-state-inline">
            <BuildingLibraryIcon class="empty-icon" />
            <p class="empty-message">Aucune classe disponible</p>
          </div>
        </div>

        <!-- Grid: Utilisateurs Récents + Notifications -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Widget Utilisateurs Récents -->
          <div class="widget-card">
            <div class="widget-header">
              <UserGroupIcon class="widget-icon text-blue-600" />
              <h2 class="widget-title">Utilisateurs Récents</h2>
              <router-link to="/admin/users" class="view-all-link">Voir tout</router-link>
            </div>
            <div v-if="recentUsers.length > 0" class="users-list">
              <div
                v-for="recentUser in recentUsers"
                :key="recentUser.id"
                class="user-item"
              >
                <div class="user-avatar">
                  {{ getInitials(recentUser.name) }}
                </div>
                <div class="user-info">
                  <p class="user-name">{{ recentUser.name }}</p>
                  <p class="user-email">{{ recentUser.email }}</p>
                </div>
                <div class="user-meta">
                  <span class="user-role-badge" :class="getRoleClass(recentUser.role)">
                    {{ getRoleLabel(recentUser.role) }}
                  </span>
                  <span class="user-date">{{ formatDate(recentUser.created_at) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-inline">
              <UserGroupIcon class="empty-icon" />
              <p class="empty-message">Aucun utilisateur récent</p>
            </div>
          </div>

          <!-- Widget Notifications - Temporairement désactivé -->
          <!-- <NotificationsWidget :limit="5" :autoRefresh="true" /> -->
        </div>

        <!-- Calendrier des événements -->
        <div class="mb-6">
          <CalendarWidget :events="calendarEvents" height="500px" />
        </div>

        <!-- Matières KLASSCI -->
        <div class="widget-card mb-6">
          <div class="widget-header">
            <BookOpenIcon class="widget-icon text-orange-600" />
            <h2 class="widget-title">Matières KLASSCI</h2>
            <span v-if="loading.matieres" class="loading-indicator">Chargement...</span>
          </div>

          <div v-if="matieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="matiere in matieres"
              :key="matiere.id"
              class="matiere-card"
            >
              <div class="matiere-header">
                <BookOpenIcon class="matiere-icon text-orange-600" />
                <h3 class="matiere-name">{{ matiere.nom }}</h3>
              </div>
              <p v-if="matiere.code" class="matiere-code">Code: {{ matiere.code }}</p>
            </div>
          </div>

          <div v-else-if="!loading.matieres" class="empty-state-inline">
            <BookOpenIcon class="empty-icon" />
            <p class="empty-message">Aucune matière disponible</p>
          </div>
        </div>

        <!-- Année universitaire -->
        <div v-if="meta?.annee_universitaire_courante" class="info-banner">
          <CalendarIcon class="info-icon" />
          <p class="info-text">
            Année universitaire courante : <strong>{{ meta.annee_universitaire_courante.nom || 'Non définie' }}</strong>
          </p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <GenerateReportModal
      v-model="showGenerateReportModal"
      @generated="handleReportGenerated"
    />
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ActivityChart from '@/components/charts/ActivityChart.vue'
import QuickActionButton from '@/components/ui/QuickActionButton.vue'
import GenerateReportModal from '@/components/modals/GenerateReportModal.vue'
import NotificationsWidget from '@/components/widgets/NotificationsWidget.vue'
import CalendarWidget from '@/components/widgets/CalendarWidget.vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import { analyticsService } from '@/services/analytics'
import {
  ShieldCheckIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

const user = ref(null)
const meta = ref(null)
const stats = ref(null)
const classes = ref([])
const matieres = ref([])
const activityData = ref(null)
const pendingTasks = ref(null)
const recentUsers = ref([])
const calendarEvents = ref([])
const showGenerateReportModal = ref(false)
const loading = ref({
  stats: false,
  classes: false,
  matieres: false,
  analytics: false
})

const CACHE_KEY_CLASSES = 'admin_classes_cache'
const CACHE_KEY_MATIERES = 'admin_matieres_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function loadKlassciData() {
  // Charger les classes avec cache
  loading.value.classes = true
  loading.value.stats = true

  try {
    const cachedClasses = localStorage.getItem(CACHE_KEY_CLASSES)
    if (cachedClasses) {
      const { data, timestamp } = JSON.parse(cachedClasses)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('📦 Classes chargées depuis le cache')
        classes.value = data
        loading.value.classes = false
        // Continuer en arrière-plan pour refresh
      }
    }

    const classesData = await klassciService.getClasses()
    classes.value = classesData
    localStorage.setItem(CACHE_KEY_CLASSES, JSON.stringify({
      data: classesData,
      timestamp: Date.now()
    }))
    console.log('✅ Classes chargées:', classesData)
  } catch (error) {
    console.error('❌ Erreur chargement classes:', error)
    classes.value = []
  } finally {
    loading.value.classes = false
  }

  // Charger les matières avec cache
  loading.value.matieres = true
  try {
    const cachedMatieres = localStorage.getItem(CACHE_KEY_MATIERES)
    if (cachedMatieres) {
      const { data, timestamp } = JSON.parse(cachedMatieres)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('📦 Matières chargées depuis le cache')
        matieres.value = data
        loading.value.matieres = false
        // Continuer en arrière-plan pour refresh
      }
    }

    const matieresData = await klassciService.getMatieres()
    matieres.value = matieresData
    localStorage.setItem(CACHE_KEY_MATIERES, JSON.stringify({
      data: matieresData,
      timestamp: Date.now()
    }))
    console.log('✅ Matières chargées:', matieresData)
  } catch (error) {
    console.error('❌ Erreur chargement matières:', error)
    matieres.value = []
  } finally {
    loading.value.matieres = false
  }

  // Charger les enseignants et calculer les vraies stats
  try {
    const enseignants = await klassciService.getEnseignants()
    console.log('✅ Enseignants chargés:', enseignants)

    // Calculer les vraies statistiques
    stats.value = {
      nb_enseignants: enseignants?.length || 0, // Nombre réel depuis BDD locale
      nb_etudiants: stats.value?.nb_etudiants || 0,
      nb_classes_actives: classes.value?.length || 0,
      nb_matieres_actives: matieres.value?.length || 0,
      nb_filieres: stats.value?.nb_filieres || 0,
      nb_niveaux: stats.value?.nb_niveaux || 0,
      nb_seances_actives: stats.value?.nb_seances_actives || 0,
      nb_evaluations: stats.value?.nb_evaluations || 0
    }

    console.log('✅ Statistiques recalculées:', stats.value)
  } catch (error) {
    console.error('❌ Erreur chargement enseignants:', error)
  } finally {
    loading.value.stats = false
  }
}

async function loadAnalytics() {
  loading.value.analytics = true
  try {
    // Charger les tendances d'activité
    const trends = await analyticsService.getActivityTrends()
    activityData.value = trends

    // Charger les tâches en attente
    const tasks = await analyticsService.getPendingTasks()
    pendingTasks.value = tasks

    // Charger les utilisateurs récents
    const users = await analyticsService.getRecentUsers()
    recentUsers.value = users

    console.log('Analytics chargées:', { trends, tasks, users })
  } catch (error) {
    console.error('Erreur chargement analytics:', error)
  } finally {
    loading.value.analytics = false
  }
}

function navigateTo(path) {
  router.push(path)
}

function handleReportGenerated() {
  console.log('Rapport PDF généré avec succès')
  // Pas besoin de recharger les données pour les rapports
}

function getDashboardTitle() {
  if (!user.value?.role) return 'Administrateur'
  if (user.value.role === 'coordinateur') return 'Coordinateur'
  if (user.value.role === 'superAdmin') return 'Super Administrateur'
  if (user.value.role === 'enseignant' || user.value.role === 'teacher') return 'Enseignant'
  return 'Administrateur'
}

function isCoordinateur() {
  return user.value?.role === 'coordinateur'
}

function isTeacher() {
  return user.value?.role === 'enseignant' || user.value?.role === 'teacher'
}

function isSuperAdmin() {
  return user.value?.role === 'superAdmin'
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getRoleLabel(role) {
  const labels = {
    'etudiant': 'Étudiant',
    'student': 'Étudiant',
    'enseignant': 'Enseignant',
    'teacher': 'Enseignant',
    'coordinateur': 'Coordinateur',
    'superAdmin': 'Admin',
    'admin': 'Admin'
  }
  return labels[role] || role
}

function getRoleClass(role) {
  const classes = {
    'etudiant': 'role-student',
    'student': 'role-student',
    'enseignant': 'role-teacher',
    'teacher': 'role-teacher',
    'coordinateur': 'role-coordinator',
    'superAdmin': 'role-admin',
    'admin': 'role-admin'
  }
  return classes[role] || 'role-default'
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`

  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

async function loadCalendarEvents() {
  try {
    // Charger les vraies séances depuis KLASSCI (30 prochains jours)
    const seances = await klassciService.getUpcomingSeances({ days: 30 })

    const events = seances.map(seance => {
      // Déterminer la couleur selon l'état visio
      let backgroundColor = '#6b7280' // gris par défaut
      let title = seance.matiere?.libelle || seance.matiere?.nom || 'Séance'

      if (seance.visio_enabled) {
        if (seance.visio_active) {
          backgroundColor = '#10b981' // vert - visio active
          title = `[VISIO EN COURS] ${title}`
        } else if (seance.visio_status === 'programmee') {
          backgroundColor = '#3b82f6' // bleu - visio programmée
          title = `[VISIO] ${title}`
        } else {
          backgroundColor = '#8b5cf6' // violet - visio activée mais pas encore programmée
          title = `[VISIO ACTIVÉE] ${title}`
        }
      }

      // Parser les dates
      const dateSeance = seance.date_seance
      const heureDebut = seance.heure_debut || '08:00'
      const heureFin = seance.heure_fin || '10:00'

      const start = new Date(`${dateSeance}T${heureDebut}:00`)
      const end = new Date(`${dateSeance}T${heureFin}:00`)

      return {
        id: `seance-${seance.id}`,
        title: `${title} - ${seance.classe?.libelle || seance.classe?.nom || 'N/A'}`,
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor,
        borderColor: backgroundColor,
        extendedProps: {
          type: 'seance',
          seanceId: seance.id,
          classe: seance.classe?.libelle || seance.classe?.nom || 'N/A',
          matiere: seance.matiere?.libelle || seance.matiere?.nom || 'N/A',
          enseignant: seance.enseignant?.nom || 'N/A',
          salle: seance.salle || '',
          visioEnabled: seance.visio_enabled || false,
          visioActive: seance.visio_active || false,
          visioStatus: seance.visio_status || null,
          description: `${seance.matiere?.libelle || 'Séance'} - Salle: ${seance.salle || 'N/A'}`,
          url: '/coordinateur/seances'
        }
      }
    })

    calendarEvents.value = events
    console.log('✅ Événements calendrier chargés depuis KLASSCI:', events.length)
  } catch (error) {
    console.error('❌ Erreur chargement événements calendrier:', error)
    // En cas d'erreur, laisser le calendrier vide
    calendarEvents.value = []
  }
}

onMounted(() => {
  user.value = auth.getUser()
  meta.value = auth.getMeta()
  stats.value = user.value?.admin_data?.statistics || {}

  console.log('AdminDashboard mounted')
  console.log('Admin User:', user.value)
  console.log('Admin Stats:', stats.value)

  // Charger les données KLASSCI
  loadKlassciData()

  // Charger les analytics
  loadAnalytics()

  // Charger les événements du calendrier
  loadCalendarEvents()
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

/* Stat cards */
.stat-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid transparent;
}

.border-l-blue {
  border-left-color: #3b82f6;
}

.border-l-green {
  border-left-color: #10b981;
}

.border-l-purple {
  border-left-color: #8b5cf6;
}

.border-l-orange {
  border-left-color: #f59e0b;
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
  flex: 1;
}

.loading-indicator {
  font-size: 0.875rem;
  color: var(--text-secondary);
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

/* Permissions */
.permissions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.permission-badge {
  padding: 0.5rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 9999px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

.action-card.highlighted {
  border: 2px solid #f59e0b;
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

/* Class card */
.class-card {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.class-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.class-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.class-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.class-niveau {
  padding: 0.25rem 0.5rem;
  background: #e0e7ff;
  color: #5b21b6;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.class-filiere {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.filiere-name {
  font-weight: 600;
}

.class-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.class-capacity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.active-badge {
  padding: 0.25rem 0.5rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

/* Matiere card */
.matiere-card {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.matiere-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.matiere-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.matiere-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.matiere-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.matiere-code {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Empty state inline */
.empty-state-inline {
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
}

.empty-message {
  color: var(--text-secondary);
}

/* Info banner */
.info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #dbeafe;
  border-radius: 0.75rem;
}

.info-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #1e40af;
}

.info-text {
  font-size: 0.875rem;
  color: #1e3a8a;
  margin: 0;
}

/* Pending Tasks Grid */
.pending-tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  border-left: 4px solid #d1d5db;
  transition: all 0.2s;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-item.urgent {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.task-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-content {
  flex: 1;
}

.task-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.task-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.task-urgent {
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 600;
  margin: 0.25rem 0 0 0;
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

  .pending-tasks-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Quick Actions Grid */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

@media (max-width: 640px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Recent Users Widget */
.view-all-link {
  margin-left: auto;
  font-size: 0.875rem;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.user-item:hover {
  background: var(--bg-tertiary);
  transform: translateX(4px);
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  border-radius: 50%;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.user-role-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.role-student {
  background: #dbeafe;
  color: #1e40af;
}

.role-teacher {
  background: #d1fae5;
  color: #065f46;
}

.role-coordinator {
  background: #fef3c7;
  color: #92400e;
}

.role-admin {
  background: #fecaca;
  color: #991b1b;
}

.role-default {
  background: #e5e7eb;
  color: #374151;
}

.user-date {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .user-item {
    padding: 0.75rem;
  }

  .user-avatar {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }

  .user-name {
    font-size: 0.8125rem;
  }

  .user-email {
    font-size: 0.6875rem;
  }

  .user-meta {
    display: none;
  }
}
</style>
