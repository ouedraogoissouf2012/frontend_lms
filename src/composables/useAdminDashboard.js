import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import {
  ROLES,
  getRoleDisplayName,
  hasRole,
  isAdmin as roleIsAdmin,
  isTeacher as roleIsTeacher,
} from '@/constants/roles'
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
  // Échec du chargement des données d'établissement, à AFFICHER : sans lui, une
  // panne KLASSCI laissait le tableau de bord muet, garni de zéros.
  const loadError = ref(null)
  const showGenerateReportModal = ref(false)
  const loading = ref({
    stats: false,
    classes: false,
    matieres: false,
    analytics: false
  })

  const { loadKlassciData, loadAnalytics, loadCalendarEvents } = useAdminDashboardData({
    stats, classes, matieres, activityData, pendingTasks, recentUsers, calendarEvents, loading, loadError,
  })

  const { getInitials, getRoleLabel, getRoleClass, formatDate } = useDashboardFormatters()

  function navigateTo(path) {
    router.push(path)
  }

  function handleReportGenerated() {
    console.log('Rapport PDF généré avec succès')
    // Pas besoin de recharger les données pour les rapports
  }

  /**
   * Titre du tableau de bord, dérivé du rôle NORMALISÉ (#18/#659).
   *
   * Comparait auparavant le rôle BRUT : `superAdmin` — super-admin d'ÉTABLISSEMENT
   * KLASSCI, donc un simple admin LMS — s'affichait « Super Administrateur »,
   * c.-à-d. au rang de gestionnaire de PLATEFORME. C'est exactement la confusion
   * que #659 a dissociée côté backend. `getRoleDisplayName` réserve ce libellé au
   * seul `supradmin`. Rôle inconnu → repli neutre (jamais de valeur brute en UI).
   */
  function getDashboardTitle() {
    return getRoleDisplayName(user.value) || 'Administrateur'
  }

  function isCoordinateur() {
    return hasRole(user.value, ROLES.COORDINATEUR)
  }

  function isTeacher() {
    return roleIsTeacher(user.value)
  }

  /**
   * Périmètre administratif (admin d'établissement OU supradmin plateforme),
   * aligné sur `Role::isAdmin()` backend. Remplace l'ancien `isSuperAdmin()` qui
   * testait le rôle brut `=== 'superAdmin'` : le supradmin PLATEFORME n'y était
   * pas reconnu et perdait les actions d'administration du tableau de bord.
   */
  function isAdmin() {
    return roleIsAdmin(user.value)
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
    showGenerateReportModal, loading, loadError,
    loadKlassciData, loadAnalytics, loadCalendarEvents,
    navigateTo, handleReportGenerated, getDashboardTitle,
    isCoordinateur, isTeacher, isAdmin,
    getInitials, getRoleLabel, getRoleClass, formatDate,
  }
}
