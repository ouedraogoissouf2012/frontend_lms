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
      <MobileSidebarNav
        :secondary-nav-items="secondaryNavItems"
        :admin-nav-items="adminNavItems"
        :active-path="activePath"
        @close="close"
        @logout="handleLogout"
      />

      <!-- Footer -->
      <div class="sidebar-footer">
        <p class="footer-text">Version 1.0.0</p>
        <p class="footer-copyright">© 2025 LMS KLASSCI</p>
      </div>
    </aside>
  </transition>
</template>

<script setup>
/**
 * MobileSidebar (#H12 ≤300) — orchestrateur du drawer mobile. La logique vit dans
 * useMobileSidebar ; la navigation est déléguée à MobileSidebarNav. Chrome
 * (overlay, en-tête, pied, transitions) conservé ici.
 */
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import MobileSidebarNav from '@/components/layout/mobile/MobileSidebarNav.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const {
  isMobile,
  activePath,
  secondaryNavItems,
  adminNavItems,
  close,
  handleLogout
} = useMobileSidebar(props, emit)
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
