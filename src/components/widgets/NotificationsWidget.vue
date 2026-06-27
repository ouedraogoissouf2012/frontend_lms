<template>
  <div class="notifications-widget">
    <!-- Header -->
    <div class="widget-header">
      <div class="header-left">
        <BellIcon class="widget-icon" :class="{ 'has-unread': unreadCount > 0 }" />
        <h2 class="widget-title">Notifications</h2>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </div>
      <div class="header-actions">
        <button
          v-if="notifications.length > 0"
          class="action-btn"
          @click="handleMarkAllAsRead"
          title="Tout marquer comme lu"
        >
          <CheckIcon class="w-4 h-4" />
        </button>
        <button
          class="action-btn"
          @click="refreshNotifications"
          :disabled="loading"
          title="Actualiser"
        >
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Loading -->
    <ContentLoader v-if="loading && notifications.length === 0" text="Chargement des notifications..." />

    <!-- Notifications List -->
    <div v-else-if="notifications.length > 0" class="notifications-list">
      <NotificationItem
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @click="handleNotificationClick"
        @mark-read="handleMarkAsRead"
        @delete="handleDelete"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <BellIcon class="empty-icon" />
      <p class="empty-message">Aucune notification</p>
      <p class="empty-subtitle">Vous êtes à jour :-)</p>
    </div>

    <!-- Footer -->
    <div v-if="notifications.length > 0" class="widget-footer">
      <router-link to="/notifications" class="view-all-link">
        Voir toutes les notifications
      </router-link>
    </div>
  </div>
</template>

<script setup>
/**
 * Widget de notifications (H8 — orchestrateur ≤300). L'état et toute la logique
 * métier (chargement, marquage, suppression, navigation) vivent dans le composable
 * useNotificationsWidget ; chaque ligne est rendue par NotificationItem.
 */
import {
  BellIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import ContentLoader from '@/components/common/ContentLoader.vue'
import NotificationItem from '@/components/widgets/NotificationItem.vue'
import { useNotificationsWidget } from '@/composables/useNotificationsWidget'

const props = defineProps({
  limit: {
    type: Number,
    default: 5
  },
  autoRefresh: {
    type: Boolean,
    default: false
  },
  refreshInterval: {
    type: Number,
    default: 60000 // 1 minute
  }
})

const emit = defineEmits(['notification-click', 'notification-read', 'notification-deleted'])

const {
  notifications,
  unreadCount,
  loading,
  refreshNotifications,
  handleMarkAsRead,
  handleMarkAllAsRead,
  handleDelete,
  handleNotificationClick
} = useNotificationsWidget(props, emit)
</script>

<style scoped>
.notifications-widget {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
  transition: all 0.3s;
}

.widget-icon.has-unread {
  color: var(--amber-500);
  animation: ring 2s ease-in-out infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-15deg); }
  20%, 40% { transform: rotate(15deg); }
}

.widget-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.5rem;
  background: var(--red-500);
  color: white;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Loading State (dette pré-existante : styles non utilisés — le template emploie
   <ContentLoader>, pas .loading-state/.spinner ; conservés verbatim pour parité) */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Notifications List */
.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-tertiary);
  margin-bottom: 1rem;
}

.empty-message {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.empty-subtitle {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin: 0;
}

/* Footer */
.widget-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.view-all-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.2s;
}

.view-all-link:hover {
  color: var(--color-info-strong);
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .notifications-list {
    max-height: 300px;
  }
}
</style>
