import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { useAdminDashboardData } from '@/composables/useAdminDashboardData'
import { useDashboardFormatters } from '@/composables/useDashboardFormatters'

/**
 * Couche données d'AdminDashboard (#H3 ≤300) : orchestrateur du tableau de bord
 * admin/coordinateur. Détient l'état partagé (utilisateur, méta, stats, classes,
 * matières, analytics, calendrier), compose useAdminDashboardData (chargements
 * KLASSCI/analytics/calendrier) et useDashboardFormatters (présentation), et expose
 * les helpers de rôle + la navigation. La vue ne fait plus que câbler.
 */
export function useAdminDashboard() {
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

  const { loadKlassciData, loadAnalytics, loadCalendarEvents } = useAdminDashboardData({
    stats, classes, matieres, activityData, pendingTasks, recentUsers, calendarEvents, loading,
  })

  const { getInitials, getRoleLabel, getRoleClass, formatDate } = useDashboardFormatters()

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

  onMounted(() => {
    user.value = auth.getUser()
    meta.value = auth.getMeta()
    stats.value = user.value?.admin_data?.statistics || {}

    // Charger les données KLASSCI
    loadKlassciData()

    // Charger les analytics
    loadAnalytics()

    // Ne pas charger automatiquement les séances ici : l'endpoint
    // /lms/seances/upcoming est coûteux et peut bloquer le serveur local.
  })

  return {
    user, meta, stats, classes, matieres,
    activityData, pendingTasks, recentUsers, calendarEvents,
    showGenerateReportModal, loading,
    loadKlassciData, loadAnalytics, loadCalendarEvents,
    navigateTo, handleReportGenerated, getDashboardTitle,
    isCoordinateur, isTeacher, isSuperAdmin,
    getInitials, getRoleLabel, getRoleClass, formatDate,
  }
}
