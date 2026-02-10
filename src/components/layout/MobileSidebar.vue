<template>
  <!-- Overlay -->
  <transition name="fade">
    <div
      v-if="isOpen && isMobile"
      @click="close"
      class="sidebar-overlay"
    ></div>
  </transition>

  <!-- Drawer -->
  <transition name="slide">
    <aside v-if="isOpen && isMobile" class="mobile-sidebar">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="logo-section">
          <span class="logo-icon">◉</span>
          <span class="logo-text">LMS KLASSCI</span>
        </div>
        <button @click="close" class="close-btn" aria-label="Fermer">
          <span class="close-icon">✕</span>
        </button>
      </div>

      <!-- Navigation secondaire -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <h3 class="section-title">Navigation</h3>

          <router-link
            v-for="item in secondaryNavItems"
            :key="item.path"
            :to="item.path"
            @click="close"
            class="nav-link"
            :class="{ active: isActive(item.path) }"
          >
            <i :class="`fa ${item.icon} nav-icon`"></i>
            <span class="nav-text">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
          </router-link>
        </div>

        <div class="nav-section" v-if="adminNavItems.length > 0">
          <h3 class="section-title">Administration</h3>

          <router-link
            v-for="item in adminNavItems"
            :key="item.path"
            :to="item.path"
            @click="close"
            class="nav-link"
            :class="{ active: isActive(item.path) }"
          >
            <i :class="`fa ${item.icon} nav-icon`"></i>
            <span class="nav-text">{{ item.label }}</span>
          </router-link>
        </div>

        <div class="nav-section">
          <h3 class="section-title">Compte</h3>

          <button @click="handleLogout" class="nav-link logout-link">
            <span class="nav-icon">→</span>
            <span class="nav-text">Déconnexion</span>
          </button>
        </div>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <p class="footer-text">Version 1.0.0</p>
        <p class="footer-copyright">© 2025 LMS KLASSCI</p>
      </div>
    </aside>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/services/api'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()

const isMobile = ref(window.innerWidth < 768)
const user = computed(() => auth.getUser())

// Detect window resize
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

// Navigation items based on user role
const secondaryNavItems = computed(() => {
  const role = user.value?.role

  // Routes communes (vides pour l'instant - à implémenter plus tard)
  const commonItems = []

  if (role === 'etudiant') {
    return [
      ...commonItems
      // À ajouter: Mes Notes, Ma Progression, etc.
    ]
  } else if (role === 'enseignant' || role === 'teacher') {
    // Items supplémentaires (pas dans BottomNavigation)
    return [
      ...commonItems,
      { path: '/teacher/seances', icon: 'fa-video-camera', label: 'Mes Séances Visio', badge: null },
      { path: '/forum', icon: 'fa-comments', label: 'Forum', badge: null },
      { path: '/attendance/seances', icon: 'fa-history', label: 'Historique', badge: null },
      { path: '/teacher/settings', icon: 'fa-cog', label: 'Paramètres', badge: null }
    ]
  } else if (role === 'coordinateur') {
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
  const role = user.value?.role

  // Pour superAdmin uniquement (coordinateur a tout dans secondaryNavItems)
  if (role === 'superAdmin') {
    return [
      { path: '/admin/classes', icon: 'fa-building', label: 'Classes', badge: null },
      { path: '/admin/matieres', icon: 'fa-book', label: 'Matières', badge: null },
      { path: '/admin/enseignants', icon: 'fa-user', label: 'Enseignants', badge: null }
    ]
  }

  return []
})

// Check if route is active
function isActive(path) {
  return route.path.startsWith(path)
}

// Close sidebar
function close() {
  emit('close')
}

// Logout
async function handleLogout() {
  try {
    await auth.logout()
    close()
    router.push('/login')
  } catch (error) {
    console.error('Erreur déconnexion:', error)
  }
}
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
  background: var(--card-bg);
  z-index: 1101;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.logo-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 0.375rem;
  transition: background 0.2s;
}

.close-btn:active {
  background: var(--bg-hover);
}

.close-icon {
  font-size: 1.25rem;
  line-height: 1;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  padding: 0 1rem;
  margin: 0 0 0.5rem 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  font-size: 0.9375rem;
  cursor: pointer;
  text-align: left;
  min-height: 44px;
}

.nav-link:active {
  background: var(--bg-hover);
}

.nav-link.active {
  background: var(--bg-hover);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
  padding-left: calc(1rem - 3px);
}

.nav-icon {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
}

.nav-badge {
  background: var(--primary-color);
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.logout-link {
  color: #ef4444;
  margin-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

/* Footer */
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.footer-text,
.footer-copyright {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0.25rem 0;
  text-align: center;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .mobile-sidebar {
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
  }
}

/* Scrollbar */
.mobile-sidebar::-webkit-scrollbar {
  width: 6px;
}

.mobile-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.mobile-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.mobile-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
