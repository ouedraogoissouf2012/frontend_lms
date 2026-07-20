import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { isStudent, isTeacher, isAdminScope } from '@/constants/roles'
import { useNotifications } from '@/composables/useNotifications'

/**
 * Couche logique de Navbar (#H12 ≤300) : titre/fil d'Ariane dérivés de la route,
 * menus (utilisateur / notifications) avec fermeture au clic extérieur, URLs
 * profil/paramètres selon le rôle normalisé (#18) et déconnexion. La vue ne fait
 * plus que câbler ces valeurs à des sous-composants présentationnels.
 *
 * Parité : comportement strictement identique à l'origine. Seul changement interne
 * (sans effet observable) : le clic-extérieur du menu utilisateur teste désormais
 * `event.target.closest('.user-menu')` au lieu d'un template ref — équivalent,
 * car il n'existe qu'un seul `.user-menu` dans le DOM.
 */
export function useNavbar() {
  const route = useRoute()
  const router = useRouter()

  const showUserMenu = ref(false)
  const showNotifications = ref(false)

  // Notifications réelles depuis l'API
  const {
    notifications,
    unreadCount: notificationUnreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    loadNotifications
  } = useNotifications(false)

  // Initiales utilisateur
  const userInitials = computed(() => {
    const user = auth.getUser()
    if (!user) return 'U'

    const firstInitial = (user.prenom || user.nom || 'U')[0]
    const lastInitial = user.nom ? user.nom[0] : ''

    return (firstInitial + lastInitial).toUpperCase()
  })

  // URLs Profil/Paramètres selon le rôle (rôle normalisé, #18)
  const profileUrl = computed(() => {
    const user = auth.getUser()
    if (isStudent(user)) return '/student/settings'
    if (isTeacher(user)) return '/teacher/profile'
    if (isAdminScope(user)) return '/admin/profile'
    return '/dashboard'
  })

  const settingsUrl = computed(() => {
    const user = auth.getUser()
    if (isStudent(user)) return '/student/settings'
    if (isTeacher(user)) return '/teacher/settings'
    if (isAdminScope(user)) return '/admin/settings'
    return '/dashboard'
  })

  const unreadCount = computed(() => notificationUnreadCount.value)

  // Titre de page depuis route.meta ou défaut
  const pageTitle = computed(() => route.meta.title || getDefaultTitle())

  const getDefaultTitle = () => {
    const path = route.path
    if (path === '/') return 'Dashboard'

    const titles = {
      '/student/classes': 'Mes Cours',
      '/student/evaluations': 'Mes Évaluations',
      '/student/seances': 'Visioconférences',
      '/student/notes': 'Mes Notes',
      '/teacher/classes': 'Mes Classes',
      '/teacher/lessons': 'Leçons',
      '/teacher/seances': 'Séances',
      '/teacher/evaluations': 'Évaluations',
      '/teacher/stats': 'Statistiques',
      '/profile': 'Mon Profil',
      '/settings': 'Paramètres'
    }

    return titles[path] || 'LMS Platform'
  }

  // Fil d'Ariane (peut être enrichi via route meta)
  const breadcrumbs = computed(() => {
    const crumbs = []
    const paths = route.path.split('/').filter(p => p)

    if (paths.length === 0) return crumbs

    let currentPath = ''
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === paths.length - 1

      // Ignore les IDs dans le fil d'Ariane
      if (/^\d+$/.test(segment)) return

      crumbs.push({
        label: formatBreadcrumb(segment),
        to: isLast ? null : normalizeBreadcrumbPath(currentPath)
      })
    })

    return crumbs
  })

  const normalizeBreadcrumbPath = (path) => {
    const aliases = {
      '/admin': '/admin/dashboard',
      '/admin/evaluations': '/admin/evaluations/results',
      '/coordinateur': '/admin/dashboard',
      '/teacher': '/teacher/dashboard',
      '/student': '/student/dashboard',
      '/attendance': '/attendance/seances',
      '/classes': null,
      '/matieres': null
    }

    if (Object.prototype.hasOwnProperty.call(aliases, path)) return aliases[path]
    return path
  }

  const formatBreadcrumb = (segment) => {
    const labels = {
      'student': 'Étudiant',
      'teacher': 'Enseignant',
      'admin': 'Admin',
      'classes': 'Classes',
      'evaluations': 'Évaluations',
      'lessons': 'Leçons',
      'seances': 'Séances',
      'notes': 'Notes',
      'stats': 'Statistiques',
      'profile': 'Profil',
      'settings': 'Paramètres'
    }

    return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value
    showNotifications.value = false
  }

  const toggleNotifications = () => {
    showNotifications.value = !showNotifications.value
    showUserMenu.value = false
  }

  // Clic sur une notification avec navigation (Option 3 - Pro)
  const handleNotificationClick = async (notification, event) => {
    await markNotificationAsRead(notification.id)

    if (notification.action_url) {
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Clic (Windows) ou Cmd+Clic (Mac) = nouvel onglet
        window.open(notification.action_url, '_blank')
      } else {
        router.push(notification.action_url)
        showNotifications.value = false
      }
    }
  }

  const markAllAsRead = async () => {
    await markAllNotificationsAsRead()
  }

  const handleLogout = async () => {
    auth.logout()
    router.push('/login')
  }

  // Ferme les menus au clic à l'extérieur
  const handleClickOutside = (event) => {
    if (!event.target.closest('.user-menu')) {
      showUserMenu.value = false
    }
    if (!event.target.closest('.notifications-panel') &&
        !event.target.closest('.icon-btn')) {
      showNotifications.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    loadNotifications()
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return {
    pageTitle,
    breadcrumbs,
    userInitials,
    profileUrl,
    settingsUrl,
    showUserMenu,
    showNotifications,
    notifications,
    unreadCount,
    toggleUserMenu,
    toggleNotifications,
    handleNotificationClick,
    markAllAsRead,
    handleLogout
  }
}
