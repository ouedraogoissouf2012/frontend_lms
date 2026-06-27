<template>
  <div
    class="notification-item"
    :class="{ 'unread': notification.is_unread }"
    @click="$emit('click', notification)"
  >
    <!-- Icon -->
    <div class="notification-icon" :class="getTypeClass(notification.data.type)">
      <component :is="getIconComponent(notification.data.icon)" class="w-5 h-5" />
    </div>

    <!-- Content -->
    <div class="notification-content">
      <p class="notification-title">{{ notification.data.title }}</p>
      <p class="notification-message">{{ notification.data.message }}</p>
      <span class="notification-time">{{ notification.time_ago }}</span>
    </div>

    <!-- Actions -->
    <div class="notification-actions">
      <button
        v-if="notification.is_unread"
        class="mark-read-btn"
        @click.stop="$emit('mark-read', notification.id)"
        title="Marquer comme lu"
      >
        <CheckIcon class="w-4 h-4" />
      </button>
      <button
        class="delete-btn"
        @click.stop="$emit('delete', notification.id)"
        title="Supprimer"
      >
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Item de notification (H8 — décomposition NotificationsWidget.vue).
 * Sous-composant de présentation : reçoit une `notification` en prop, émet les
 * actions (`click`, `mark-read`, `delete`). Les helpers de présentation
 * (classe de type, composant d'icône) sont locaux et purs. Aucun appel API.
 */
import {
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  BellIcon
} from '@heroicons/vue/24/outline'

defineProps({
  notification: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'mark-read', 'delete'])

function getTypeClass(type) {
  const classes = {
    info: 'type-info',
    success: 'type-success',
    warning: 'type-warning',
    danger: 'type-danger'
  }
  return classes[type] || 'type-info'
}

function getIconComponent(iconName) {
  const icons = {
    InformationCircleIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    XCircleIcon,
    BellIcon
  }
  return icons[iconName] || BellIcon
}
</script>

<style scoped>
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item:hover {
  background: var(--bg-secondary);
}

.notification-item.unread {
  background: linear-gradient(90deg, var(--blue-50) 0%, transparent 100%);
  border-left: 3px solid var(--blue-500);
}

.notification-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.type-info {
  background: var(--info-bg);
  color: var(--info-text);
}

.type-success {
  background: var(--emerald-100);
  color: var(--emerald-800);
}

.type-warning {
  background: var(--warning-bg);
  color: var(--amber-800);
}

.type-danger {
  background: var(--error-bg);
  color: var(--error-text);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.notification-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.notification-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.mark-read-btn,
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mark-read-btn {
  color: var(--emerald-500);
}

.mark-read-btn:hover {
  background: var(--emerald-100);
  border-color: var(--emerald-500);
}

.delete-btn {
  color: var(--red-500);
}

.delete-btn:hover {
  background: var(--error-bg);
  border-color: var(--red-500);
}

/* Responsive */
@media (max-width: 768px) {
  .notification-item {
    padding: 0.75rem 1rem;
  }

  .notification-actions {
    opacity: 1;
  }
}
</style>
