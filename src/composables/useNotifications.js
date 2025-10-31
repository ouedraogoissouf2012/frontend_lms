import { ref, onMounted, onUnmounted } from 'vue'
import { notificationsService } from '@/services/notifications'

let lastCheckTime = null
let checkInterval = null
const previousNotificationIds = new Set()
let sessionStartTime = null // Timestamp du démarrage de la session

export function useNotifications(options = {}) {
  const {
    autoCheck = true,
    checkIntervalMs = 30000, // 30 secondes
    showToast = true
  } = options

  const unreadCount = ref(0)
  const notifications = ref([])
  const isLoading = ref(false)

  async function loadNotifications() {
    try {
      isLoading.value = true
      const data = await notificationsService.getRecentNotifications(10)
      notifications.value = data

      // Mettre à jour le compteur
      const count = await notificationsService.getUnreadCount()
      unreadCount.value = count

      return data
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function checkNewNotifications() {
    try {
      const data = await notificationsService.getRecentNotifications(10)

      // Trouver les nouvelles notifications
      const newNotifications = data.filter(notif => {
        const isNew = !previousNotificationIds.has(notif.id)
        previousNotificationIds.add(notif.id)

        // Ne considérer comme "nouvelle" que si créée après le début de la session
        if (isNew && notif.is_unread && sessionStartTime) {
          const notifTime = new Date(notif.created_at).getTime()
          return notifTime > sessionStartTime
        }

        return false
      })

      // Afficher un toast pour chaque nouvelle notification
      if (showToast && newNotifications.length > 0 && typeof window !== 'undefined' && window.$toast) {
        newNotifications.forEach(notif => {
          window.$toast({
            title: notif.title,
            message: notif.message,
            type: getNotificationType(notif.type),
            duration: 6000
          })
        })
      }

      // Mettre à jour les données
      notifications.value = data
      const count = await notificationsService.getUnreadCount()
      unreadCount.value = count

      lastCheckTime = Date.now()
    } catch (error) {
      console.error('Erreur vérification nouvelles notifications:', error)
    }
  }

  function getNotificationType(type) {
    const typeMap = {
      'lesson_published': 'success',
      'forum_reply': 'info',
      'quiz_available': 'warning',
      'grade_received': 'success',
      'visio_scheduled': 'info',
      'visio_starting': 'warning'
    }
    return typeMap[type] || 'info'
  }

  async function markAsRead(notificationId) {
    const success = await notificationsService.markAsRead(notificationId)
    if (success) {
      // Mettre à jour localement
      const notif = notifications.value.find(n => n.id === notificationId)
      if (notif) {
        notif.is_unread = false
      }
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
    return success
  }

  async function markAllAsRead() {
    const success = await notificationsService.markAllAsRead()
    if (success) {
      notifications.value.forEach(n => {
        n.is_unread = false
      })
      unreadCount.value = 0
    }
    return success
  }

  async function deleteNotification(notificationId) {
    const success = await notificationsService.deleteNotification(notificationId)
    if (success) {
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        const wasUnread = notifications.value[index].is_unread
        notifications.value.splice(index, 1)
        if (wasUnread) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }
    }
    return success
  }

  function startAutoCheck() {
    if (checkInterval) {
      clearInterval(checkInterval)
    }

    // Premier check immédiat
    loadNotifications().then(() => {
      // Initialiser previousNotificationIds avec les IDs actuels
      notifications.value.forEach(notif => {
        previousNotificationIds.add(notif.id)
      })
    })

    // Puis checks réguliers
    checkInterval = setInterval(checkNewNotifications, checkIntervalMs)
  }

  function stopAutoCheck() {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }

  onMounted(() => {
    // Enregistrer le moment où la session commence
    sessionStartTime = Date.now()

    if (autoCheck) {
      startAutoCheck()
    } else {
      loadNotifications()
    }
  })

  onUnmounted(() => {
    stopAutoCheck()
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    checkNewNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startAutoCheck,
    stopAutoCheck
  }
}
