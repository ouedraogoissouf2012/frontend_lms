<template>
  <!-- Bouton cloche -->
  <button class="icon-btn" @click="$emit('toggle')" title="Notifications">
    <i class="fa fa-bell icon"></i>
    <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
  </button>

  <!-- Panneau Notifications -->
  <transition name="slide-down">
    <div v-if="show" class="notifications-panel">
      <div class="panel-header">
        <h3>Notifications</h3>
        <button @click="$emit('mark-all-as-read')" class="text-btn">Tout marquer comme lu</button>
      </div>
      <div class="notifications-list">
        <div v-if="notifications.length === 0" class="empty-state">
          <i class="fa fa-bell-o icon"></i>
          <p>Aucune notification</p>
        </div>
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification-item', { unread: notification.is_unread }]"
          @click="$emit('select', notification, $event)"
        >
          <i :class="`fa ${getIconEmoji(notification.icon)} notif-icon`"></i>
          <div class="notif-content">
            <p class="notif-title">{{ notification.title }}</p>
            <p class="notif-message">{{ notification.message }}</p>
            <span class="notif-time">{{ notification.time_ago || formatTime(notification.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * Cloche + panneau de notifications de la navbar (#H12). Présentationnel :
 * reçoit la liste et le compteur, émet `toggle`/`mark-all-as-read`/`select`.
 * Les helpers de formatage (date relative, mapping d'icônes MDI→FA) sont purs et
 * vivent ici car ils ne concernent que l'affichage de ce panneau.
 */
defineProps({
  notifications: { type: Array, default: () => [] },
  unreadCount: { type: Number, default: 0 },
  show: { type: Boolean, default: false }
})

defineEmits(['toggle', 'mark-all-as-read', 'select'])

// Date relative pour les notifications
const formatTime = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days}j`
}

// Convertit les codes d'icônes Material Design en Font Awesome
const getIconEmoji = (iconCode) => {
  const iconMap = {
    'mdi-message-reply': 'fa-comment',
    'mdi-check-circle': 'fa-check-circle',
    'mdi-book-open': 'fa-book',
    'mdi-clipboard-list': 'fa-pencil-square-o',
    'mdi-star': 'fa-star',
    'mdi-book-edit': 'fa-pencil',
    'mdi-clock-alert': 'fa-clock-o',
    'mdi-video-outline': 'fa-video-camera',
    'mdi-video-check': 'fa-video-camera',
    'mdi-bell': 'fa-bell'
  }
  return iconMap[iconCode] || 'fa-bell'
}
</script>

<style scoped>
.icon-btn {
  position: relative;
  background: transparent;
  border: none;
  padding: var(--spacing-sm);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
  font-size: 1.25rem;
}

.icon-btn:hover {
  background: var(--bg-hover);
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--red-500);
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}

/* Notifications Panel */
.notifications-panel {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: var(--spacing-xl);
  width: 380px;
  max-height: 500px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: var(--z-dropdown);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

.panel-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.text-btn {
  background: transparent;
  border: none;
  color: var(--blue-600);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.text-btn:hover {
  background: var(--bg-hover);
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--text-tertiary);
}

.empty-state .icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.notification-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.notification-item::after {
  content: '→';
  position: absolute;
  right: var(--spacing-lg);
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: all var(--transition-fast);
  color: var(--blue-600);
  font-size: 1.2rem;
}

.notification-item:hover {
  background: var(--bg-hover);
  padding-right: calc(var(--spacing-lg) + 30px);
}

.notification-item:hover::after {
  opacity: 1;
  transform: translateY(-50%) translateX(-5px);
}

.notification-item.unread {
  background: var(--blue-50);
}

[data-theme="dark"] .notification-item.unread {
  background: rgba(59, 130, 246, 0.05);
}

.notif-icon {
  font-size: 1.5rem;
  min-width: 32px;
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.notif-message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs) 0;
}

.notif-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-base);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive */
@media (max-width: 768px) {
  .notifications-panel {
    right: var(--spacing-md);
    width: calc(100vw - 2 * var(--spacing-md));
    max-width: 380px;
  }
}
</style>
