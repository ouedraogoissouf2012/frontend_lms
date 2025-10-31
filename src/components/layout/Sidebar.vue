<template>
  <aside :class="['modern-sidebar', { collapsed: isCollapsed }]">
    <!-- Logo / Header -->
    <div class="sidebar-header" @click="toggleSidebar">
      <div class="logo-container">
        <div class="logo-icon">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="8" class="logo-bg"/>
            <rect x="15" y="15" width="70" height="70" rx="4" class="logo-frame"/>
            <text x="50" y="75" font-family="Arial, sans-serif" font-size="50" font-weight="bold" class="logo-letter" text-anchor="middle">A</text>
          </svg>
        </div>
        <transition name="fade">
          <span v-if="!isCollapsed" class="logo-text">KLASSCI</span>
        </transition>
      </div>
      <button class="collapse-btn" :title="isCollapsed ? 'Expand' : 'Collapse'">
        <span v-if="isCollapsed">→</span>
        <span v-else>←</span>
      </button>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <!-- Menu Sections -->
      <template v-for="(section, index) in menuSections" :key="index">
        <!-- Section with submenu -->
        <div v-if="section.children" class="nav-section">
          <div
            class="nav-item parent-item"
            @click="toggleSubmenu(index)"
            :class="{ 'submenu-open': openSubmenus[index] }"
          >
            <span class="nav-icon">{{ section.icon }}</span>
            <transition name="fade">
              <span v-if="!isCollapsed" class="nav-text">{{ section.label }}</span>
            </transition>
            <transition name="fade">
              <span v-if="!isCollapsed" class="submenu-arrow">
                {{ openSubmenus[index] ? '▾' : '▸' }}
              </span>
            </transition>
          </div>

          <!-- Submenu items -->
          <transition name="slide">
            <div v-if="openSubmenus[index] && !isCollapsed" class="submenu">
              <router-link
                v-for="item in section.children"
                :key="item.to"
                :to="item.to"
                class="nav-sub-item"
                exact-active-class="active"
              >
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-text">{{ item.label }}</span>
              </router-link>
            </div>
          </transition>
        </div>

        <!-- Single item without submenu -->
        <router-link
          v-else
          :to="section.to"
          class="nav-item"
          exact-active-class="active"
          :title="isCollapsed ? section.label : ''"
        >
          <span class="nav-icon">{{ section.icon }}</span>
          <transition name="fade">
            <span v-if="!isCollapsed" class="nav-text">{{ section.label }}</span>
          </transition>
        </router-link>
      </template>
    </nav>

    <!-- User Section (bottom) -->
    <div class="sidebar-footer">
      <div class="user-profile" @click="goToProfile">
        <div class="avatar">
          <span>{{ userInitials }}</span>
        </div>
        <transition name="fade">
          <div v-if="!isCollapsed" class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRole }}</div>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/services/api'

export default {
  name: 'ModernSidebar',

  setup() {
    const route = useRoute()
    const router = useRouter()

    const isCollapsed = ref(false)
    const openSubmenus = ref({})

    // User info from auth service
    const userName = computed(() => {
      const user = auth.getUser()
      return user ? `${user.nom || ''} ${user.prenom || ''}`.trim() : 'Utilisateur'
    })

    const userRole = computed(() => {
      const user = auth.getUser()
      if (!user) return 'Invité'

      const roleLabels = {
        'etudiant': 'Étudiant',
        'student': 'Étudiant',
        'enseignant': 'Enseignant',
        'teacher': 'Enseignant',
        'coordinateur': 'Coordinateur',
        'admin': 'Administrateur',
        'superAdmin': 'Super Administrateur'
      }

      return roleLabels[user.role] || user.role
    })

    const userInitials = computed(() => {
      const user = auth.getUser()
      if (!user) return 'U'

      const firstInitial = (user.prenom || user.nom || 'U')[0]
      const lastInitial = user.nom ? user.nom[0] : ''

      return (firstInitial + lastInitial).toUpperCase()
    })

    // Build menu based on user role
    const menuSections = computed(() => {
      const user = auth.getUser()
      if (!user) return []

      const isStudent = ['etudiant', 'student'].includes(user.role)
      const isTeacher = ['enseignant', 'teacher', 'coordinateur', 'superAdmin'].includes(user.role)
      const isAdmin = ['admin', 'coordinateur', 'superAdmin'].includes(user.role)

      const menu = []

      // Student Menu
      if (isStudent) {
        menu.push({
          icon: '▣',
          label: 'Dashboard',
          to: '/student/dashboard'
        })
        menu.push({
          icon: '◈',
          label: 'Mes Cours',
          to: '/student/courses'
        })
        menu.push({
          icon: '◷',
          label: 'Emploi du Temps',
          to: '/student/schedule'
        })
        menu.push({
          icon: '✎',
          label: 'Évaluations',
          to: '/student/evaluations-list'
        })
        menu.push({
          icon: '◘',
          label: 'Forum',
          to: '/forum'
        })
        menu.push({
          icon: '⚙',
          label: 'Paramètres',
          to: '/student/settings'
        })
      }

      // Dashboard - Admin pour coordinateur/admin, Teacher pour enseignant
      if (isTeacher || isAdmin) {
        menu.push({
          icon: '▣',
          label: 'Dashboard',
          to: isAdmin ? '/admin/dashboard' : '/teacher/dashboard'
        })
      }

      // Teacher Menu
      if (isTeacher) {
        // Ne pas afficher "Mes Classes" pour coordinateur (il a la vue admin)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '⌂',
          label: 'Mes Classes',
          to: '/teacher/classes'
        })
        }
        // Matières - NOUVEAU
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '◈',
          label: 'Matières',
          to: '/teacher/matieres'
        })
        }
        // Ne pas afficher Leçons pour coordinateur (pas enseignant selon KLASSCI)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '◐',
          label: 'Leçons',
          to: '/teacher/lessons'
        })
        }
        // Ne pas afficher Séances pour coordinateur (il a la version admin)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '◎',
          label: 'Séances',
          to: '/teacher/seances'
        })
        }
        // Ne pas afficher Visioconférences pour coordinateur (il a la version admin)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '▶',
          label: 'Visioconférences',
          to: '/teacher/visio-list'
        })
        }
        // Ne pas afficher Évaluations pour coordinateur (pas enseignant selon KLASSCI)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '☰',
          label: 'Évaluations',
          children: [
            { icon: '✚', label: 'Créer', to: '/teacher/evaluations/create' },
            { icon: '▤', label: 'Mes Évaluations', to: '/teacher/evaluations' },
            { icon: '✓', label: 'Corrections', to: '/teacher/evaluations/corrections' }
          ]
        })
        }
        // Ne pas afficher Statistiques pour coordinateur (il a la version admin)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '▲',
          label: 'Statistiques',
          to: '/teacher/stats'
        })
        }
      }

      // Admin Menu
      if (isAdmin) {
        // Utilisateurs - seulement pour admin complet (pas coordinateur)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '◉',
          label: 'Utilisateurs',
          to: '/admin/users'
        })
        }
        menu.push({
          icon: '▦',
          label: 'Classes',
          to: '/admin/classes'
        })
        menu.push({
          icon: '≡',
          label: 'Matières',
          to: '/admin/matieres'
        })
        // Enseignants - accessible pour coordinateur (endpoint KLASSCI disponible)
        menu.push({
          icon: '👤',
          label: 'Enseignants',
          to: '/admin/enseignants'
        })
        // Séances - Masqué pour coordinateur (endpoint /seances retourne 404 dans KLASSCI)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '◎',
          label: 'Séances',
          to: '/admin/seances'
        })
        }
        // Visioconférences - Masqué pour coordinateur (dépend de /seances)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '▶',
          label: 'Visioconférences',
          to: '/admin/visioconferences'
        })
        }
        // Statistiques - Masqué pour coordinateur (données admin_data limitées)
        if (user.role !== 'coordinateur') {
        menu.push({
          icon: '▲',
          label: 'Statistiques',
          to: '/admin/stats'
        })
        }
      }

      // Forum - accessible pour tous (enseignants et admins)
      if (isTeacher || isAdmin) {
        menu.push({
          icon: '◘',
          label: 'Forum',
          to: '/forum'
        })
      }

      // Paramètres - dernière entrée pour tous
      if (isTeacher || isAdmin) {
        menu.push({
          icon: '⚙',
          label: 'Paramètres',
          to: isAdmin ? '/admin/settings' : '/teacher/settings'
        })
      }

      return menu
    })

    // Toggle sidebar collapse
    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value
      if (isCollapsed.value) {
        openSubmenus.value = {}
      }
      // Store preference
      localStorage.setItem('sidebar-collapsed', isCollapsed.value)
    }

    // Toggle submenu
    const toggleSubmenu = (index) => {
      if (isCollapsed.value) {
        isCollapsed.value = false
      }
      openSubmenus.value[index] = !openSubmenus.value[index]
    }

    // Go to profile (dashboard pour l'instant)
    const goToProfile = () => {
      router.push('/student/dashboard')
    }

    // Auto-open submenu if current route matches
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

    // Restore collapsed state from localStorage
    onMounted(() => {
      const savedState = localStorage.getItem('sidebar-collapsed')
      if (savedState !== null) {
        isCollapsed.value = savedState === 'true'
      }
      updateActiveSubmenu()
    })

    // Watch route changes
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
}
</script>

<style scoped>
.modern-sidebar {
  width: 260px;
  height: 100vh;
  background: linear-gradient(180deg, var(--sidebar-bg-start) 0%, var(--sidebar-bg-end) 100%);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  position: relative;
  overflow: hidden;
}

.modern-sidebar.collapsed {
  width: 80px;
}

/* Header */
.sidebar-header {
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--sidebar-border);
  cursor: pointer;
  user-select: none;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.logo-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

/* Logo colors - Light mode */
.logo-bg {
  fill: #1E6FD9;
}

.logo-frame {
  fill: white;
}

.logo-letter {
  fill: #1E6FD9;
}

/* Logo colors - Dark mode */
:global(.dark) .logo-bg {
  fill: #3B82F6;
}

:global(.dark) .logo-frame {
  fill: #1F2937;
}

:global(.dark) .logo-letter {
  fill: #60A5FA;
}

.logo-text {
  font-size: var(--font-size-lg);
  font-weight: 700;
  white-space: nowrap;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: var(--sidebar-text);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
  font-size: 1.25rem;
  line-height: 1;
}

.collapse-btn:hover {
  background: var(--sidebar-hover);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-section {
  margin-bottom: var(--spacing-xs);
}

.nav-item,
.parent-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  color: var(--sidebar-text);
  text-decoration: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
}

.nav-item:hover,
.parent-item:hover {
  background: var(--sidebar-hover);
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--sidebar-active);
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  background: var(--sidebar-text);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.nav-icon {
  font-size: 1.25rem;
  min-width: 24px;
  text-align: center;
}

.nav-text {
  flex: 1;
  white-space: nowrap;
}

.submenu-arrow {
  margin-left: auto;
  font-size: 0.875rem;
  transition: transform var(--transition-fast);
}

.parent-item.submenu-open .submenu-arrow {
  transform: rotate(0deg);
}

/* Submenu */
.submenu {
  padding-left: calc(var(--spacing-md) + 24px + var(--spacing-md));
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.nav-sub-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.nav-sub-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text);
  transform: translateX(2px);
}

.nav-sub-item.active {
  background: var(--sidebar-active);
  color: var(--sidebar-text);
  font-weight: 600;
}

/* Footer / User Profile */
.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--sidebar-border);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.user-profile:hover {
  background: var(--sidebar-hover);
}

.avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: var(--radius-full);
  background: var(--sidebar-active);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-weight: 600;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: var(--font-size-xs);
  color: var(--sidebar-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all var(--transition-base);
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

/* Scrollbar for nav */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--sidebar-border);
  border-radius: var(--radius-full);
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--sidebar-hover);
}

/* Responsive */
@media (max-width: 768px) {
  .modern-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: var(--z-fixed);
  }

  .modern-sidebar.collapsed {
    transform: translateX(-100%);
  }
}
</style>
