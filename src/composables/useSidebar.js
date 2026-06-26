import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { isTeacher, isStudent, getRoleDisplayName } from '@/constants/roles'
import { sidebarKey } from '@/constants/storageKeys'
import { useNavigation } from '@/composables/useNavigation'

/**
 * Couche logique de la sidebar (#H12 ≤300, #108) : état repli/sous-menus, infos
 * utilisateur, menu dérivé du rôle et persistance du repli (scopé par institution)
 * avec ouverture auto du sous-menu actif. La vue ne fait plus que câbler ces
 * valeurs à des sous-composants présentationnels.
 *
 * Le menu provient de la SOURCE UNIQUE déclarative `useNavigation()` (#104),
 * partagée avec la BottomNavigation : plus de logique de rôle dupliquée ici. Les
 * sections retournées sont déjà filtrées par rôle, à parité stricte (mêmes routes,
 * libellés et ordre) avec l'ancien `buildMenuSections` — cf. NavConfig.test.js.
 */
export function useSidebar() {
  const route = useRoute()
  const router = useRouter()

  const isCollapsed = ref(false)
  const openSubmenus = ref({})

  // Infos utilisateur depuis le service auth
  const userName = computed(() => {
    const user = auth.getUser()
    return user ? `${user.nom || ''} ${user.prenom || ''}`.trim() : 'Utilisateur'
  })

  const userRole = computed(() => {
    const user = auth.getUser()
    if (!user) return 'Invité'
    // Libellé unique centralisé (#18 R4.3)
    return getRoleDisplayName(user) || 'Invité'
  })

  const userInitials = computed(() => {
    const user = auth.getUser()
    if (!user) return 'U'

    const firstInitial = (user.prenom || user.nom || 'U')[0]
    const lastInitial = user.nom ? user.nom[0] : ''

    return (firstInitial + lastInitial).toUpperCase()
  })

  // Menu selon le rôle, issu de la source unique déclarative (#104). `sections`
  // est un computed déjà filtré sur auth.getUser() — réévalué comme avant.
  const { sections: menuSections } = useNavigation()

  // Restaure l'état replié depuis localStorage (scopé par institution)
  const getSidebarKey = () => sidebarKey(auth.getInstitution())

  // Bascule le repli de la sidebar
  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
    if (isCollapsed.value) {
      openSubmenus.value = {}
    }
    // Mémorise la préférence
    localStorage.setItem(getSidebarKey(), isCollapsed.value)
  }

  // Bascule un sous-menu
  const toggleSubmenu = (index) => {
    if (isCollapsed.value) {
      isCollapsed.value = false
    }
    openSubmenus.value[index] = !openSubmenus.value[index]
  }

  // Va au profil - redirige selon le rôle de l'utilisateur
  const goToProfile = () => {
    const user = auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    if (isStudent(user)) {
      router.push('/student/settings')
    } else if (isTeacher(user)) {
      router.push('/teacher/profile')
    } else {
      // admin / supradmin / coordinateur (et secretaire→coordinateur)
      router.push('/admin/profile')
    }
  }

  // Ouvre automatiquement le sous-menu si la route courante correspond
  const updateActiveSubmenu = () => {
    menuSections.value.forEach((section, index) => {
      if (section.children) {
        const isActive = section.children.some(child =>
          route.path.startsWith(child.to)
        )
        if (isActive && !isCollapsed.value) {
          openSubmenus.value[index] = true
        }
      }
    })
  }

  onMounted(() => {
    const savedState = localStorage.getItem(getSidebarKey())
    if (savedState !== null) {
      isCollapsed.value = savedState === 'true'
    }
    updateActiveSubmenu()
  })

  // Suit les changements de route
  watch(() => route.path, () => {
    updateActiveSubmenu()
  })

  return {
    isCollapsed,
    openSubmenus,
    menuSections,
    userName,
    userRole,
    userInitials,
    toggleSidebar,
    toggleSubmenu,
    goToProfile
  }
}
