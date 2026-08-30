import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { getRoleDisplayName, isStudent, isTeacher, isAdminScope } from '@/constants/roles'

/**
 * Couche logique du header mobile (#H12 ≤300) : détection mobile (resize), état
 * des panneaux (notifications / menu utilisateur, mutuellement exclusifs), infos
 * utilisateur (initiales, libellé de rôle #18, chemin profil par rôle) et
 * déconnexion. Le `toggle-sidebar` est relayé au parent via l'`emit` fourni.
 *
 * Comportement strictement identique à l'origine (parité vérifiée par
 * MobileHeader.test.js : rendu mobile, initiales, emit toggle-sidebar).
 *
 * @param {(event: string, ...args: any[]) => void} emit l'emit du composant hôte
 */
export function useMobileHeader(emit) {
  const router = useRouter()

  const isMobile = ref(window.innerWidth < 768)
  const showNotifications = ref(false)
  const showUserMenu = ref(false)
  const hasUnreadNotifications = ref(false)

  // Détecte le redimensionnement de la fenêtre
  const handleResize = () => {
    isMobile.value = window.innerWidth < 768
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  // Infos utilisateur
  const user = computed(() => auth.getUser())
  const userName = computed(() => user.value?.name || 'Utilisateur')

  const userInitials = computed(() => {
    const name = userName.value
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  })

  // Libellé unique centralisé (#18 R4.3)
  const userRoleLabel = computed(() => getRoleDisplayName(user.value))

  // Chemins ALIGNÉS sur useNavbar (routes existantes) : l'étudiant n'a pas de page
  // profil dédiée (→ settings), le coordinateur passe par l'espace admin.
  const profilePath = computed(() => {
    const u = user.value
    if (isStudent(u)) return '/student/settings'
    if (isTeacher(u)) return '/teacher/profile'
    if (isAdminScope(u)) return '/admin/profile'
    return '/dashboard'
  })

  const settingsPath = computed(() => {
    const u = user.value
    if (isStudent(u)) return '/student/settings'
    if (isTeacher(u)) return '/teacher/settings'
    if (isAdminScope(u)) return '/admin/settings'
    return '/dashboard'
  })

  // Bascules
  function toggleSidebar() {
    emit('toggle-sidebar')
    closeAllPanels()
  }

  function toggleNotifications() {
    showNotifications.value = !showNotifications.value
    showUserMenu.value = false
  }

  function toggleUserMenu() {
    showUserMenu.value = !showUserMenu.value
    showNotifications.value = false
  }

  function closeAllPanels() {
    showNotifications.value = false
    showUserMenu.value = false
  }

  // Déconnexion
  async function handleLogout() {
    try {
      await auth.logout()
      router.push('/login')
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }

  return {
    isMobile,
    showNotifications,
    showUserMenu,
    hasUnreadNotifications,
    userName,
    userInitials,
    userRoleLabel,
    profilePath,
    settingsPath,
    toggleSidebar,
    toggleNotifications,
    toggleUserMenu,
    closeAllPanels,
    handleLogout
  }
}
