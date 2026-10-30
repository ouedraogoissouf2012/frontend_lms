import api from './api'
import { endpoints } from './endpoints'
// Relatif, pas `@/` : ce service est dans le graphe du runner de contrat natif.
import { invalidResponseError } from './errorHandler'

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

      const response = await api.get(endpoints.notifications.list, { params })

      return response.success ? response : null
    } catch (error) {
      console.error('Erreur récupération notifications:', error)
      return null
    }
  },

  /**
   * Nombre RÉEL de notifications non lues (compteur du serveur, pour le badge).
   * Forme mesurée : `{ success: true, count }`, `count` à la racine de l'enveloppe.
   * @returns {Promise<number>}
   * @throws {Error} avec `userMessage` : panne HTTP ou réseau, ou réponse non
   *   conforme — jamais un 0 fabriqué, que le badge prendrait pour une mesure.
   */
  async getUnreadCount() {
    try {
      const response = await api.get(endpoints.notifications.unreadCount)
      if (response?.success !== true || !Number.isInteger(response.count) || response.count < 0) {
        throw invalidResponseError('GET /notifications/unread-count sans success ni compte')
      }
      return response.count
    } catch (error) {
      console.error('Erreur récupération count notifications:', error)
      throw error
    }
  },

  /**
   * Notifications non lues les plus récentes (le serveur borne à `limit`).
   * @returns {Promise<Array>}
   * @throws {Error} avec `userMessage` : panne ou réponse non conforme — jamais
   *   une liste vide, que l'écran prendrait pour « aucune notification ».
   */
  async getRecentNotifications(limit = 5) {
    try {
      const response = await api.get(endpoints.notifications.recent, {
        params: { limit }
      })
      if (response?.success !== true || !Array.isArray(response.data)) {
        throw invalidResponseError('GET /notifications/recent sans success ni liste')
      }
      return response.data
    } catch (error) {
      console.error('Erreur récupération notifications récentes:', error)
      throw error
    }
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId) {
    try {
      const response = await api.post(endpoints.notifications.markAsRead(notificationId))
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
      const response = await api.post(endpoints.notifications.markAllAsRead)
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
      const response = await api.delete(endpoints.notifications.delete(notificationId))
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
      const response = await api.delete(endpoints.notifications.deleteReadAll)
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
      const response = await api.post(endpoints.admin.notifications.create, data)
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
      const response = await api.get(endpoints.admin.notifications.stats)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération stats notifications:', error)
      return null
    }
  }
}

export default notificationsService
