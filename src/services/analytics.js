/**
 * Service pour interagir avec les analytics admin
 */
import api from './api'
import { endpoints } from './endpoints'

export const analyticsService = {
  /**
   * Récupérer les tendances d'activité (30 derniers jours)
   * @returns {Promise<Object>} Données pour graphe Chart.js
   */
  async getActivityTrends() {
    try {
      const response = await api.get(endpoints.admin.analytics.activityTrends)
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
      const response = await api.get(endpoints.admin.analytics.systemMetrics)
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
      const response = await api.get(endpoints.admin.analytics.pendingTasks)
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
      const response = await api.get(endpoints.admin.analytics.recentUsers)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération utilisateurs récents:', error)
      throw error
    }
  }
}

export default analyticsService
