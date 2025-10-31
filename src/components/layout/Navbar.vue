<template>
  <nav class="modern-navbar">
    <!-- Left Section - Page Title / Breadcrumbs -->
    <div class="navbar-left">
      <h1 class="page-title">{{ pageTitle }}</h1>
      <div v-if="breadcrumbs.length" class="breadcrumbs">
        <span v-for="(crumb, index) in breadcrumbs" :key="index" class="breadcrumb-item">
          <span v-if="index > 0" class="separator">/</span>
          <router-link v-if="crumb.to" :to="crumb.to" class="breadcrumb-link">
            {{ crumb.label }}
          </router-link>
          <span v-else class="breadcrumb-text">{{ crumb.label }}</span>
        </span>
      </div>
    </div>

    <!-- Right Section - Actions -->
    <div class="navbar-right">
      <!-- Search (optional, can be enabled later) -->
      <!-- <div class="search-box">
        <input type="text" placeholder="Rechercher..." />
      </div> -->

      <!-- Notifications -->
      <button class="icon-btn" @click="toggleNotifications" title="Notifications">
        <span class="icon">◉</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </button>

      <!-- Theme Toggle -->
      <ThemeToggle />

      <!-- User Menu -->
      <div class="user-menu" @click="toggleUserMenu" ref="userMenuRef">
        <div class="user-avatar">
          <span>{{ userInitials }}</span>
        </div>
        <transition name="dropdown">
          <div v-if="showUserMenu" class="dropdown-menu">
            <router-link :to="profileUrl" class="dropdown-item">
              <span class="icon">◉</span>
              <span>Mon Profil</span>
            </router-link>
            <router-link :to="settingsUrl" class="dropdown-item">
              <span class="icon">⚙</span>
              <span>Paramètres</span>
            </router-link>
            <hr class="dropdown-divider" />
            <button @click="handleLogout" class="dropdown-item">
              <span class="icon">↪</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Notifications Panel -->
    <transition name="slide-down">
      <div v-if="showNotifications" class="notifications-panel">
        <div class="panel-header">
          <h3>Notifications</h3>
          <button @click="markAllAsRead" class="text-btn">Tout marquer comme lu</button>
        </div>
        <div class="notifications-list">
          <div v-if="notifications.length === 0" class="empty-state">
            <span class="icon">○</span>
            <p>Aucune notification</p>
          </div>
          <div
            v-for="notification in notifications"
            :key="notification.id"
            :class="['notification-item', { unread: notification.is_unread }]"
            @click="handleNotificationClick(notification, $event)"
          >
            <span class="notif-icon">{{ getIconEmoji(notification.icon) }}</span>
            <div class="notif-content">
              <p class="notif-title">{{ notification.title }}</p>
              <p class="notif-message">{{ notification.message }}</p>
              <span class="notif-time">{{ notification.time_ago || formatTime(notification.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/services/api'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { useNotifications } from '@/composables/useNotifications'

export default {
  name: 'ModernNavbar',

  components: {
    ThemeToggle
  },

  setup() {
    const route = useRoute()
    const router = useRouter()

    const showUserMenu = ref(false)
    const showNotifications = ref(false)
    const userMenuRef = ref(null)

    // Real notifications from API
    const {
      notifications,
      unreadCount: notificationUnreadCount,
      markAsRead: markNotificationAsRead,
      markAllAsRead: markAllNotificationsAsRead,
      loadNotifications
    } = useNotifications(false)

    // User info
    const userInitials = computed(() => {
      const user = auth.getUser()
      if (!user) return 'U'

      const firstInitial = (user.prenom || user.nom || 'U')[0]
      const lastInitial = user.nom ? user.nom[0] : ''

      return (firstInitial + lastInitial).toUpperCase()
    })

    // User role
    const userRole = computed(() => {
      const user = auth.getUser()
      return user?.role || 'guest'
    })

    // Profile and Settings URLs based on role
    const profileUrl = computed(() => {
      const role = userRole.value
      if (role === 'etudiant' || role === 'student') {
        return '/student/settings'
      }
      if (role === 'enseignant' || role === 'teacher') {
        return '/teacher/profile'
      }
      if (role === 'coordinateur' || role === 'superAdmin') {
        return '/admin/profile'
      }
      return '/dashboard'
    })

    const settingsUrl = computed(() => {
      const role = userRole.value
      if (role === 'etudiant' || role === 'student') {
        return '/student/settings'
      }
      if (role === 'enseignant' || role === 'teacher') {
        return '/teacher/settings'
      }
      if (role === 'coordinateur' || role === 'superAdmin') {
        return '/admin/settings'
      }
      return '/dashboard'
    })

    // Unread count from composable
    const unreadCount = computed(() => notificationUnreadCount.value)

    // Page title from route meta or default
    const pageTitle = computed(() => {
      return route.meta.title || getDefaultTitle()
    })

    // Generate default title from route path
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

    // Breadcrumbs (can be enhanced with route meta)
    const breadcrumbs = computed(() => {
      const crumbs = []
      const paths = route.path.split('/').filter(p => p)

      if (paths.length === 0) return crumbs

      // Build breadcrumbs from path
      let currentPath = ''
      paths.forEach((segment, index) => {
        currentPath += `/${segment}`
        const isLast = index === paths.length - 1

        // Skip IDs in breadcrumbs
        if (/^\d+$/.test(segment)) return

        crumbs.push({
          label: formatBreadcrumb(segment),
          to: isLast ? null : currentPath
        })
      })

      return crumbs
    })

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

    // Format time for notifications
    const formatTime = (date) => {
      const now = new Date()
      const diff = now - new Date(date)
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'À l\'instant'
      if (minutes < 60) return `Il y a ${minutes} min`
      if (hours < 24) return `Il y a ${hours}h`
      return `Il y a ${days}j`
    }

    // Convert Material Design icon codes to emojis
    const getIconEmoji = (iconCode) => {
      const iconMap = {
        'mdi-message-reply': '💭',
        'mdi-check-circle': '✔️',
        'mdi-book-open': '📚',
        'mdi-clipboard-list': '📝',
        'mdi-star': '⭐',
        'mdi-book-edit': '✏️',
        'mdi-clock-alert': '⏰',
        'mdi-video-outline': '📹',
        'mdi-video-check': '🎬',
        'mdi-bell': '🔔'
      }
      return iconMap[iconCode] || '🔔'
    }

    // Toggle user menu
    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
      showNotifications.value = false
    }

    // Toggle notifications
    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value
      showUserMenu.value = false
    }

    // Handle notification click with navigation (Option 3 - Pro)
    const handleNotificationClick = async (notification, event) => {
      // Mark as read
      await markNotificationAsRead(notification.id)

      // Navigate if action_url exists
      if (notification.action_url) {
        if (event.ctrlKey || event.metaKey) {
          // Ctrl+Click (Windows) or Cmd+Click (Mac) = Open in new tab
          window.open(notification.action_url, '_blank')
        } else {
          // Normal click = Navigate in same tab
          router.push(notification.action_url)
          showNotifications.value = false
        }
      }
    }

    // Mark all as read
    const markAllAsRead = async () => {
      await markAllNotificationsAsRead()
    }

    // Logout
    const handleLogout = async () => {
      auth.logout()
      router.push('/login')
    }

    // Close menus when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
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
      userMenuRef,
      notifications,
      unreadCount,
      toggleUserMenu,
      toggleNotifications,
      handleNotificationClick,
      markAllAsRead,
      handleLogout,
      formatTime,
      getIconEmoji
    }
  }
}
</script>

<style scoped>
.modern-navbar {
  height: 64px;
  background: var(--navbar-bg);
  border-bottom: 1px solid var(--navbar-border);
  box-shadow: var(--navbar-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  transition: all var(--transition-base);
}

/* Left Section */
.navbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.separator {
  color: var(--text-tertiary);
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.breadcrumb-link:hover {
  color: var(--blue-600);
}

.breadcrumb-text {
  color: var(--text-primary);
  font-weight: 500;
}

/* Right Section */
.navbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.icon-btn {
  position: relative;
  background: transparent;
  border: none;
  padding: var(--spacing-sm);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
  font-size: 1.25rem;
}

.icon-btn:hover {
  background: var(--bg-hover);
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}

/* User Menu */
.user-menu {
  position: relative;
  cursor: pointer;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--blue-600) 0%, var(--blue-400) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-sm);
  transition: transform var(--transition-fast);
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  min-width: 200px;
  padding: var(--spacing-sm);
  z-index: var(--z-dropdown);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: background-color var(--transition-fast);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: var(--font-size-sm);
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-divider {
  margin: var(--spacing-sm) 0;
  border: none;
  border-top: 1px solid var(--border-primary);
}

/* Notifications Panel */
.notifications-panel {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: var(--spacing-xl);
  width: 380px;
  max-height: 500px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: var(--z-dropdown);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

.panel-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.text-btn {
  background: transparent;
  border: none;
  color: var(--blue-600);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.text-btn:hover {
  background: var(--bg-hover);
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--text-tertiary);
}

.empty-state .icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.notification-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.notification-item::after {
  content: '→';
  position: absolute;
  right: var(--spacing-lg);
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: all var(--transition-fast);
  color: var(--blue-600);
  font-size: 1.2rem;
}

.notification-item:hover {
  background: var(--bg-hover);
  padding-right: calc(var(--spacing-lg) + 30px);
}

.notification-item:hover::after {
  opacity: 1;
  transform: translateY(-50%) translateX(-5px);
}

.notification-item.unread {
  background: var(--blue-50);
}

[data-theme="dark"] .notification-item.unread {
  background: rgba(59, 130, 246, 0.05);
}

.notif-icon {
  font-size: 1.5rem;
  min-width: 32px;
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.notif-message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
}

.notif-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-base);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive */
@media (max-width: 768px) {
  .modern-navbar {
    padding: 0 var(--spacing-md);
  }

  .breadcrumbs {
    display: none;
  }

  .notifications-panel {
    right: var(--spacing-md);
    width: calc(100vw - 2 * var(--spacing-md));
    max-width: 380px;
  }
}
</style>
