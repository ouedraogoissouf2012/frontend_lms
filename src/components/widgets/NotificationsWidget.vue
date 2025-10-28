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
    <div v-if="loading && notifications.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement des notifications...</p>
    </div>

    <!-- Notifications List -->
    <div v-else-if="notifications.length > 0" class="notifications-list">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'unread': notification.is_unread }"
        @click="handleNotificationClick(notification)"
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
            @click.stop="handleMarkAsRead(notification.id)"
            title="Marquer comme lu"
          >
            <CheckIcon class="w-4 h-4" />
          </button>
          <button
            class="delete-btn"
            @click.stop="handleDelete(notification.id)"
            title="Supprimer"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { notificationsService } from '@/services/notifications'
import {
  BellIcon,
  CheckIcon,
  ArrowPathIcon,
  XMarkIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)

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

async function loadNotifications() {
  loading.value = true
  try {
    // Charger les notifications récentes
    const data = await notificationsService.getRecentNotifications(props.limit)
    notifications.value = data

    // Charger le count
    const count = await notificationsService.getUnreadCount()
    unreadCount.value = count

    console.log('Notifications chargées:', { notifications: data, unreadCount: count })
  } catch (error) {
    console.error('Erreur chargement notifications:', error)
  } finally {
    loading.value = false
  }
}

async function refreshNotifications() {
  await loadNotifications()
}

async function handleMarkAsRead(notificationId) {
  const success = await notificationsService.markAsRead(notificationId)
  if (success) {
    // Mettre à jour localement
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.is_unread = false
    }
    unreadCount.value = Math.max(0, unreadCount.value - 1)

    emit('notification-read', notificationId)
  }
}

async function handleMarkAllAsRead() {
  const success = await notificationsService.markAllAsRead()
  if (success) {
    // Mettre à jour toutes les notifications
    notifications.value.forEach(n => {
      n.is_unread = false
    })
    unreadCount.value = 0

    emit('notification-read', 'all')
  }
}

async function handleDelete(notificationId) {
  const success = await notificationsService.deleteNotification(notificationId)
  if (success) {
    // Retirer de la liste
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      const wasUnread = notifications.value[index].is_unread
      notifications.value.splice(index, 1)

      if (wasUnread) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }

      emit('notification-deleted', notificationId)
    }
  }
}

function handleNotificationClick(notification) {
  // Marquer comme lu si non lu
  if (notification.is_unread) {
    handleMarkAsRead(notification.id)
  }

  emit('notification-click', notification)

  // Naviguer si action_url existe
  if (notification.data.action_url) {
    router.push(notification.data.action_url)
  }
}

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

onMounted(() => {
  loadNotifications()

  // Auto-refresh si activé
  if (props.autoRefresh) {
    setInterval(() => {
      loadNotifications()
    }, props.refreshInterval)
  }
})
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
  color: #f59e0b;
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
  background: #ef4444;
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

/* Loading State */
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
  background: linear-gradient(90deg, #eff6ff 0%, transparent 100%);
  border-left: 3px solid #3b82f6;
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
  background: #dbeafe;
  color: #1e40af;
}

.type-success {
  background: #d1fae5;
  color: #065f46;
}

.type-warning {
  background: #fef3c7;
  color: #92400e;
}

.type-danger {
  background: #fee2e2;
  color: #991b1b;
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
  color: #10b981;
}

.mark-read-btn:hover {
  background: #d1fae5;
  border-color: #10b981;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
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
  color: #2563eb;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .notifications-list {
    max-height: 300px;
  }

  .notification-item {
    padding: 0.75rem 1rem;
  }

  .notification-actions {
    opacity: 1;
  }
}
</style>
