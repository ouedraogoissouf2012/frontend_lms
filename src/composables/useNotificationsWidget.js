import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notificationsService } from '@/services/notifications'

/**
 * Composable du widget de notifications (H8 — décomposition NotificationsWidget.vue
 * pour ramener le FICHIER ENTIER sous 300 lignes).
 *
 * Encapsule l'état (liste + compteur non-lus + loading) et toute la logique métier
 * (chargement, rafraîchissement, marquage lu / tout lu, suppression, navigation au
 * clic). Le rendu d'un item (icône/type) est délégué au sous-composant présentationnel
 * NotificationItem.vue. Aucune logique de présentation ici.
 *
 * @param {{ limit: number, autoRefresh: boolean, refreshInterval: number }} props
 * @param {(event: string, payload?: any) => void} emit
 */
export function useNotificationsWidget(props, emit) {
  const router = useRouter()

  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)

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

  onMounted(() => {
    loadNotifications()

    // Auto-refresh si activé
    if (props.autoRefresh) {
      setInterval(() => {
        loadNotifications()
      }, props.refreshInterval)
    }
  })

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    refreshNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleNotificationClick
  }
}
