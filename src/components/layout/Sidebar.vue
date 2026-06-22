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
            <i :class="`fa ${section.icon} nav-icon`"></i>
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
                <i :class="`fa ${item.icon} nav-icon`"></i>
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
          <i :class="`fa ${section.icon} nav-icon`"></i>
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
import { isTeacher, isStudent, getRoleDisplayName } from '@/constants/roles'
import { sidebarKey } from '@/constants/storageKeys'
import { buildMenuSections } from '@/utils/sidebarMenu'

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

    // Build menu based on user role (logique pure extraite dans utils/sidebarMenu)
    const menuSections = computed(() => buildMenuSections(auth.getUser()))

    // Toggle sidebar collapse
    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value
      if (isCollapsed.value) {
        openSubmenus.value = {}
      }
      // Store preference
      localStorage.setItem(getSidebarKey(), isCollapsed.value)
    }

    // Toggle submenu
    const toggleSubmenu = (index) => {
      if (isCollapsed.value) {
        isCollapsed.value = false
      }
      openSubmenus.value[index] = !openSubmenus.value[index]
    }

    // Go to profile - redirige selon le rôle de l'utilisateur
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

    // Restore collapsed state from localStorage (scopé par institution)
    const getSidebarKey = () => sidebarKey(auth.getInstitution())

    onMounted(() => {
      const savedState = localStorage.getItem(getSidebarKey())
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
