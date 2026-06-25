<template>
  <transition name="slide-down">
    <div v-if="show" class="notifications-panel">
      <div class="panel-header">
        <h3 class="panel-title">Notifications</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      <div class="panel-content">
        <p class="empty-message">Aucune notification pour le moment</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * Panneau de notifications du header mobile (#H12). Présentationnel : visible
 * selon `show`, émet `close`. (État vide statique, parité avec l'origine.)
 */
defineProps({
  show: { type: Boolean, default: false }
})

defineEmits(['close'])
</script>

<style scoped>
/* Panel (chrome dupliqué verbatim depuis MobileHeader, scoped à ce composant) */
.notifications-panel {
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
  .notifications-panel {
    box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.5);
  }
}
</style>
