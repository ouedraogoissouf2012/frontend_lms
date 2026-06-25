<template>
  <nav class="modern-navbar">
    <!-- Left Section - Page Title / Breadcrumbs -->
    <NavbarBreadcrumbs :page-title="pageTitle" :breadcrumbs="breadcrumbs" />

    <!-- Right Section - Actions -->
    <div class="navbar-right">
      <!-- Notifications -->
      <NavbarNotifications
        :notifications="notifications"
        :unread-count="unreadCount"
        :show="showNotifications"
        @toggle="toggleNotifications"
        @mark-all-as-read="markAllAsRead"
        @select="handleNotificationClick"
      />

      <!-- Theme Toggle -->
      <ThemeToggle />

      <!-- User Menu -->
      <NavbarUserMenu
        :user-initials="userInitials"
        :show="showUserMenu"
        :profile-url="profileUrl"
        :settings-url="settingsUrl"
        @toggle="toggleUserMenu"
        @logout="handleLogout"
      />
    </div>
  </nav>
</template>

<script>
/**
 * Navbar (#H12 ≤300) — orchestrateur. La logique vit dans useNavbar ; l'UI est
 * composée de NavbarBreadcrumbs, NavbarNotifications, ThemeToggle et NavbarUserMenu.
 */
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import NavbarBreadcrumbs from '@/components/layout/navbar/NavbarBreadcrumbs.vue'
import NavbarNotifications from '@/components/layout/navbar/NavbarNotifications.vue'
import NavbarUserMenu from '@/components/layout/navbar/NavbarUserMenu.vue'
import { useNavbar } from '@/composables/useNavbar'

export default {
  name: 'ModernNavbar',

  components: {
    ThemeToggle,
    NavbarBreadcrumbs,
    NavbarNotifications,
    NavbarUserMenu
  },

  setup() {
    return useNavbar()
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

/* Right Section */
.navbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* Responsive */
@media (max-width: 768px) {
  .modern-navbar {
    padding: 0 var(--spacing-md);
  }
}
</style>
