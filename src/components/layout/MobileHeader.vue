<template>
  <header class="mobile-header" v-if="isMobile">
    <button @click="toggleSidebar" class="hamburger-btn" aria-label="Menu">
      <span class="hamburger-icon">☰</span>
    </button>

    <div class="header-logo">
      <span class="logo-text">LMS</span>
    </div>

    <div class="header-actions">
      <button @click="toggleNotifications" class="action-btn" aria-label="Notifications">
        <span class="action-icon">🔔</span>
        <span v-if="hasUnreadNotifications" class="notification-badge"></span>
      </button>

      <button @click="toggleUserMenu" class="action-btn user-btn" aria-label="Profil">
        <div class="user-avatar">
          {{ userInitials }}
        </div>
      </button>
    </div>

    <!-- Notifications Panel -->
    <transition name="slide-down">
      <div v-if="showNotifications" class="notifications-panel">
        <div class="panel-header">
          <h3 class="panel-title">Notifications</h3>
          <button @click="toggleNotifications" class="close-btn">✕</button>
        </div>
        <div class="panel-content">
          <p class="empty-message">Aucune notification pour le moment</p>
        </div>
      </div>
    </transition>

    <!-- User Menu -->
    <transition name="slide-down">
      <div v-if="showUserMenu" class="user-menu-panel">
        <div class="panel-header">
          <div class="user-info">
            <div class="user-avatar-large">{{ userInitials }}</div>
            <div>
              <p class="user-name">{{ userName }}</p>
              <p class="user-role">{{ userRoleLabel }}</p>
            </div>
          </div>
          <button @click="toggleUserMenu" class="close-btn">✕</button>
        </div>
        <div class="panel-content">
          <router-link :to="profilePath" @click="toggleUserMenu" class="menu-item">
            <span class="menu-icon">●</span>
            <span>Mon Profil</span>
          </router-link>
          <router-link to="/settings" @click="toggleUserMenu" class="menu-item">
            <span class="menu-icon">⚙</span>
            <span>Paramètres</span>
          </router-link>
          <button @click="handleLogout" class="menu-item logout-item">
            <span class="menu-icon">→</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- Overlay -->
    <div
      v-if="showNotifications || showUserMenu"
      @click="closeAllPanels"
      class="overlay"
    ></div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()

const isMobile = ref(window.innerWidth < 768)
const showNotifications = ref(false)
const showUserMenu = ref(false)
const hasUnreadNotifications = ref(false)

// Detect window resize
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// User info
const user = computed(() => auth.getUser())
const userName = computed(() => user.value?.name || 'Utilisateur')
const userRole = computed(() => user.value?.role || '')

const userInitials = computed(() => {
  const name = userName.value
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

const userRoleLabel = computed(() => {
  const roles = {
    'etudiant': 'Étudiant',
    'enseignant': 'Enseignant',
    'teacher': 'Enseignant',
    'coordinateur': 'Coordinateur',
    'superAdmin': 'Administrateur'
  }
  return roles[userRole.value] || userRole.value
})

const profilePath = computed(() => {
  const role = userRole.value
  if (role === 'etudiant') return '/student/profile'
  if (role === 'enseignant' || role === 'teacher') return '/teacher/profile'
  if (role === 'coordinateur') return '/coordinateur/profile'
  return '/profile'
})

// Toggle functions
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

// Logout
async function handleLogout() {
  try {
    await auth.logout()
    router.push('/login')
  } catch (error) {
    console.error('Erreur déconnexion:', error)
  }
}
</script>

<style scoped>
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  z-index: 1001;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  padding: 0;
  transition: background 0.2s;
  border-radius: 0.5rem;
}

.hamburger-btn:active {
  background: var(--bg-hover);
}

.hamburger-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.header-logo {
  flex: 1;
  text-align: center;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  padding: 0;
  transition: background 0.2s;
  border-radius: 0.5rem;
}

.action-btn:active {
  background: var(--bg-hover);
}

.action-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid var(--card-bg);
}

.user-avatar,
.user-avatar-large {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: 600;
}

.user-avatar {
  width: 32px;
  height: 32px;
  font-size: 0.75rem;
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  font-size: 1rem;
  flex-shrink: 0;
}

/* Panels */
.notifications-panel,
.user-menu-panel {
  position: fixed;
  top: 56px;
  right: 0;
  width: 100%;
  max-width: 320px;
  background: var(--card-bg);
  border-left: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1002;
  max-height: calc(100vh - 56px - 56px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.user-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1.25rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.close-btn:active {
  background: var(--bg-hover);
}

.panel-content {
  padding: 0.5rem;
}

.empty-message {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 0.5rem;
  transition: background 0.2s;
  border: none;
  background: none;
  width: 100%;
  font-size: 0.9375rem;
  cursor: pointer;
  text-align: left;
}

.menu-item:active {
  background: var(--bg-hover);
}

.menu-icon {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
}

.logout-item {
  color: #ef4444;
  margin-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  border-radius: 0;
  padding-top: 1rem;
}

/* Overlay */
.overlay {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

/* Animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .mobile-header {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .notifications-panel,
  .user-menu-panel {
    box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.5);
  }
}
</style>
