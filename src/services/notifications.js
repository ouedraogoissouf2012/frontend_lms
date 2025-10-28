import api from './api'

/**
 * Service de gestion des notifications
 */
export const notificationsService = {
  /**
   * Récupérer toutes les notifications (paginées)
   */
  async getNotifications(page = 1, perPage = 10, unreadOnly = false) {
    try {
      const params = {
        page,
        per_page: perPage,
        unread_only: unreadOnly
      }

      const response = await api.get('/notifications', { params })

      return response.success ? response : null
    } catch (error) {
      console.error('Erreur récupération notifications:', error)
      return null
    }
  },

  /**
   * Récupérer le nombre de notifications non lues
   */
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count')
      return response.success ? response.count : 0
    } catch (error) {
      console.error('Erreur récupération count notifications:', error)
      return 0
    }
  },

  /**
   * Récupérer les notifications récentes (pour widget)
   */
  async getRecentNotifications(limit = 5) {
    try {
      const response = await api.get('/notifications/recent', {
        params: { limit }
      })

      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération notifications récentes:', error)
      return []
    }
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId) {
    try {
      const response = await api.post(`/notifications/${notificationId}/mark-as-read`)
      return response.success
    } catch (error) {
      console.error('Erreur marquage notification:', error)
      return false
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead() {
    try {
      const response = await api.post('/notifications/mark-all-as-read')
      return response.success
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error)
      return false
    }
  },

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.success
    } catch (error) {
      console.error('Erreur suppression notification:', error)
      return false
    }
  },

  /**
   * Supprimer toutes les notifications lues
   */
  async deleteAllRead() {
    try {
      const response = await api.delete('/notifications/read/all')
      return response.success
    } catch (error) {
      console.error('Erreur suppression notifications lues:', error)
      return false
    }
  },

  /**
   * Créer une notification manuelle (admin uniquement)
   */
  async createNotification(data) {
    try {
      const response = await api.post('/admin/notifications/create', data)
      return response.success
    } catch (error) {
      console.error('Erreur création notification:', error)
      return false
    }
  },

  /**
   * Récupérer les statistiques des notifications (admin)
   */
  async getStats() {
    try {
      const response = await api.get('/admin/notifications/stats')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération stats notifications:', error)
      return null
    }
  }
}

export default notificationsService
