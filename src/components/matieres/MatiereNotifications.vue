<template>
  <div class="notifications-container">
    <transition-group name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification-toast',
          `notification-${notification.type}`
        ]"
      >
        <div class="notification-content">
          <span class="notification-icon">
            <svg v-if="notification.type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="notification.type === 'error'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="notification.type === 'warning'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </span>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
/**
 * Notifications toast de MatiereDetails (#H9 ≤300). Presentation pure : affiche
 * la pile de notifications. CSS deplace VERBATIM (specifique a ce composant).
 */
defineProps({
  notifications: { type: Array, default: () => [] }
})
</script>

<style scoped>
/* Notifications Toast System */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification-toast {
  min-width: 320px;
  max-width: 450px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  backdrop-filter: blur(10px);
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-message {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
}

/* Success notification */
.notification-success {
  background: linear-gradient(135deg, var(--emerald-500) 0%, var(--emerald-600) 100%);
  color: white;
  border-left: 4px solid var(--emerald-800);
}

/* Error notification */
.notification-error {
  background: linear-gradient(135deg, var(--red-500) 0%, var(--red-600) 100%);
  color: white;
  border-left: 4px solid var(--error-text);
}

/* Warning notification */
.notification-warning {
  background: linear-gradient(135deg, var(--amber-500) 0%, var(--amber-600) 100%);
  color: white;
  border-left: 4px solid var(--amber-800);
}

/* Info notification */
.notification-info {
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  border-left: 4px solid var(--info-text);
}

/* Transitions pour Vue */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(400px);
  opacity: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
