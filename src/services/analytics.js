/**
 * Service pour interagir avec les analytics admin
 */
import api from './api'

export const analyticsService = {
  /**
   * Récupérer les tendances d'activité (30 derniers jours)
   * @returns {Promise<Object>} Données pour graphe Chart.js
   */
  async getActivityTrends() {
    try {
      const response = await api.get('/admin/analytics/activity-trends')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération tendances activité:', error)
      throw error
    }
  },

  /**
   * Récupérer les métriques système globales
   * @returns {Promise<Object>} Métriques (users, lessons, evaluations, etc.)
   */
  async getSystemMetrics() {
    try {
      const response = await api.get('/admin/analytics/system-metrics')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération métriques système:', error)
      throw error
    }
  },

  /**
   * Récupérer les tâches en attente
   * @returns {Promise<Object>} Tâches en attente (evals non notées, etc.)
   */
  async getPendingTasks() {
    try {
      const response = await api.get('/admin/analytics/pending-tasks')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération tâches en attente:', error)
      throw error
    }
  },

  /**
   * Récupérer les utilisateurs récents
   * @returns {Promise<Array>} Liste des 10 derniers utilisateurs
   */
  async getRecentUsers() {
    try {
      const response = await api.get('/admin/analytics/recent-users')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération utilisateurs récents:', error)
      throw error
    }
  }
}

export default analyticsService
