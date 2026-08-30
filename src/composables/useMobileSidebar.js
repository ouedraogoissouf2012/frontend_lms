import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { isStudent, isTeacher, isSupradmin, hasRole, ROLES } from '@/constants/roles'

/**
 * Couche logique du drawer mobile (#H12 ≤300) : détection mobile (resize, ferme
 * le drawer si on repasse en desktop), items de navigation selon le rôle
 * (secondaire + administration), chemin actif et déconnexion. La visibilité est
 * pilotée par la prop `isOpen` du parent ; la fermeture est relayée via `emit`.
 *
 * Comportement strictement identique à l'origine (parité vérifiée par
 * MobileSidebar.test.js : rendu ouvert/mobile, entrées enseignant, emit close).
 *
 * @param {{ isOpen: boolean }} props les props réactives du composant hôte
 * @param {(event: string, ...args: any[]) => void} emit l'emit du composant hôte
 */
export function useMobileSidebar(props, emit) {
  const route = useRoute()
  const router = useRouter()

  const isMobile = ref(window.innerWidth < 768)
  const user = computed(() => auth.getUser())
  const activePath = computed(() => route.path)

  // Ferme le drawer
  function close() {
    emit('close')
  }

  // Détecte le redimensionnement de la fenêtre
  const handleResize = () => {
    isMobile.value = window.innerWidth < 768
    if (!isMobile.value && props.isOpen) {
      close()
    }
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  // Items de navigation selon le rôle
  const secondaryNavItems = computed(() => {
    const u = user.value

    // Routes communes (vides pour l'instant - à implémenter plus tard)
    const commonItems = []

    if (isStudent(u)) {
      return [
        ...commonItems
        // À ajouter: Mes Notes, Ma Progression, etc.
      ]
    } else if (isTeacher(u)) {
      // Items supplémentaires (pas dans BottomNavigation)
      return [
        ...commonItems,
        { path: '/teacher/seances', icon: 'fa-video-camera', label: 'Mes Séances Visio', badge: null },
        { path: '/forum', icon: 'fa-comments', label: 'Forum', badge: null },
        { path: '/attendance/seances', icon: 'fa-history', label: 'Historique', badge: null },
        { path: '/teacher/settings', icon: 'fa-cog', label: 'Paramètres', badge: null }
      ]
    } else if (hasRole(u, ROLES.COORDINATEUR)) {
      // Items supplémentaires (pas dans BottomNavigation)
      return [
        ...commonItems,
        { path: '/forum', icon: 'fa-comments', label: 'Forum', badge: null },
        { path: '/attendance/seances', icon: 'fa-history', label: 'Historique', badge: null },
        { path: '/admin/settings', icon: 'fa-cog', label: 'Paramètres', badge: null }
      ]
    }

    return commonItems
  })

  const adminNavItems = computed(() => {
    const u = user.value
    // Supradmin PLATEFORME : gère les institutions (tenants), pas le contenu intra-école
    // (les écrans intra-école lui renvoient 403 : institution_id NULL). #659.
    if (isSupradmin(u)) {
      return [
        { path: '/admin/institutions', icon: 'fa-university', label: 'Institutions', badge: null }
      ]
    }
    // Admin d'ÉTABLISSEMENT (rôle LMS 'admin', inclut le 'superAdmin' d'école KLASSCI) :
    // raccourcis d'administration intra-école. Le coordinateur a les siens dans
    // secondaryNavItems ; on cible donc l'admin strict (hasRole ADMIN).
    if (hasRole(u, ROLES.ADMIN)) {
      return [
        { path: '/admin/classes', icon: 'fa-building', label: 'Classes', badge: null },
        { path: '/admin/matieres', icon: 'fa-book', label: 'Matières', badge: null },
        { path: '/admin/enseignants', icon: 'fa-user', label: 'Enseignants', badge: null }
      ]
    }

    return []
  })

  // Déconnexion
  async function handleLogout() {
    try {
      await auth.logout()
      close()
      router.push('/login')
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }

  return {
    isMobile,
    activePath,
    secondaryNavItems,
    adminNavItems,
    close,
    handleLogout
  }
}
