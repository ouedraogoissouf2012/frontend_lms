<template>
  <header class="mobile-header" v-if="isMobile">
    <button @click="toggleSidebar" class="hamburger-btn" aria-label="Menu">
      <i class="fa fa-bars hamburger-icon"></i>
    </button>

    <div class="header-logo">
      <span class="logo-text">LMS</span>
    </div>

    <div class="header-actions">
      <button @click="toggleNotifications" class="action-btn" aria-label="Notifications">
        <i class="fa fa-bell action-icon"></i>
        <span v-if="hasUnreadNotifications" class="notification-badge"></span>
      </button>

      <button @click="toggleUserMenu" class="action-btn user-btn" aria-label="Profil">
        <div class="user-avatar">
          {{ userInitials }}
        </div>
      </button>
    </div>

    <!-- Notifications Panel -->
    <MobileNotificationsPanel :show="showNotifications" @close="toggleNotifications" />

    <!-- User Menu -->
    <MobileUserMenuPanel
      :show="showUserMenu"
      :user-initials="userInitials"
      :user-name="userName"
      :user-role-label="userRoleLabel"
      :profile-path="profilePath"
      @close="toggleUserMenu"
      @logout="handleLogout"
    />

    <!-- Overlay -->
    <div
      v-if="showNotifications || showUserMenu"
      @click="closeAllPanels"
      class="overlay"
    ></div>
  </header>
</template>

<script setup>
/**
 * MobileHeader (#H12 ≤300) — orchestrateur. La logique vit dans useMobileHeader ;
 * les panneaux déroulants sont MobileNotificationsPanel et MobileUserMenuPanel.
 */
import { useMobileHeader } from '@/composables/useMobileHeader'
import MobileNotificationsPanel from '@/components/layout/mobile/MobileNotificationsPanel.vue'
import MobileUserMenuPanel from '@/components/layout/mobile/MobileUserMenuPanel.vue'

const emit = defineEmits(['toggle-sidebar'])

const {
  isMobile,
  showNotifications,
  showUserMenu,
  hasUnreadNotifications,
  userName,
  userInitials,
  userRoleLabel,
  profilePath,
  toggleSidebar,
  toggleNotifications,
  toggleUserMenu,
  closeAllPanels,
  handleLogout
} = useMobileHeader(emit)
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

/* user-avatar : base partagée (.user-avatar/.user-avatar-large) + spécifique,
   fusionnées verbatim car le sélecteur combiné couvrait header + menu. */
.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  width: 32px;
  height: 32px;
  font-size: 0.75rem;
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

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .mobile-header {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}
</style>
