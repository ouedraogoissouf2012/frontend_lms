<template>
  <div class="sidebar-header" @click="$emit('toggle')">
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
</template>

<script setup>
/**
 * En-tête de la sidebar (#H12) : logo KLASSCI + bouton de repli. Présentationnel :
 * reçoit `isCollapsed`, émet `toggle` au clic (parité avec toggleSidebar).
 */
defineProps({
  isCollapsed: { type: Boolean, default: false }
})

defineEmits(['toggle'])
</script>

<style scoped>
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
  fill: var(--brand-blue-600);
}

.logo-frame {
  fill: white;
}

.logo-letter {
  fill: var(--brand-blue-600);
}

/* Logo colors - Dark mode */
:global(.dark) .logo-bg {
  fill: var(--blue-400);
}

:global(.dark) .logo-frame {
  fill: var(--gray-800);
}

:global(.dark) .logo-letter {
  fill: var(--blue-500);
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

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
