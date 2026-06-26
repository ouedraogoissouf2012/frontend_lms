import api from './api'
import { endpoints } from './endpoints'

/**
 * Service LMS — domaine NOTIFICATIONS de séance (`/lms/notifications/*`).
 * Préférences et rappels liés aux séances. Le client notifications général
 * (cloche, mark-as-read) reste src/services/notifications.js.
 *
 * NOTE intercepteur : api.js retourne déjà response.data (ne pas refaire .data ici).
 */
export const lmsNotificationsService = {
  /**
   * Récupérer préférences de notification d'un utilisateur
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getNotificationPreferences(userId) {
    try {
      return await api.get(endpoints.lms.notifications.preferences(userId))
    } catch (error) {
      console.error('Erreur récupération préférences notifications:', error)
      throw error
    }
  },

  /**
   * Envoyer rappel de séance
   * @param {Object} data - { seance_id, user_ids, reminder_time }
   * @returns {Promise<Object>}
   */
  async sendSessionReminder(data) {
    try {
      return await api.post(endpoints.lms.notifications.sendSessionReminder, data)
    } catch (error) {
      console.error('Erreur envoi rappel séance:', error)
      throw error
    }
  }
}

export default lmsNotificationsService
