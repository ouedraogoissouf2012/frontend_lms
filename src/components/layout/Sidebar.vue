<template>
  <aside :class="['modern-sidebar', { collapsed: isCollapsed }]">
    <SidebarHeader :is-collapsed="isCollapsed" @toggle="toggleSidebar" />

    <SidebarNav
      :menu-sections="menuSections"
      :is-collapsed="isCollapsed"
      :open-submenus="openSubmenus"
      @toggle-submenu="toggleSubmenu"
    />

    <SidebarUserProfile
      :user-initials="userInitials"
      :user-name="userName"
      :user-role="userRole"
      :is-collapsed="isCollapsed"
      @go-to-profile="goToProfile"
    />
  </aside>
</template>

<script>
/**
 * Sidebar (#H12 ≤300) — orchestrateur. La logique vit dans useSidebar ; l'UI est
 * composée de SidebarHeader, SidebarNav et SidebarUserProfile.
 */
import SidebarHeader from '@/components/layout/sidebar/SidebarHeader.vue'
import SidebarNav from '@/components/layout/sidebar/SidebarNav.vue'
import SidebarUserProfile from '@/components/layout/sidebar/SidebarUserProfile.vue'
import { useSidebar } from '@/composables/useSidebar'

export default {
  name: 'ModernSidebar',

  components: {
    SidebarHeader,
    SidebarNav,
    SidebarUserProfile
  },

  setup() {
    return useSidebar()
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
