/**
 * Domaine KLASSCI — séances & visio élève (G9 — split de klassci.js).
 *
 * Séances à venir (`/lms/seances/upcoming`) et visioconférences de l'élève
 * (`/lms/seances/my-classes`). Comportement et payloads STRICTEMENT identiques
 * à l'original.
 */
import api from './api'
import { endpoints } from './endpoints'

export const klassciSeancesService = {
  /**
   * Récupérer les séances depuis KLASSCI (admin/coordinateur)
   * @param {Object} filters - Filtres optionnels (days, teacher_id, classe_id)
   * @returns {Promise<Object>} { success, data: séances[] }
   */
  async getSeances(filters = {}) {
    try {
      const response = await api.get(endpoints.lms.seances.upcoming, { params: filters })
      return response
    } catch (error) {
      console.error('Erreur récupération séances:', error)
      throw error
    }
  },

  /**
   * Récupérer les séances à venir depuis KLASSCI
   * @param {Object} filters - Filtres optionnels (days, teacher_id, classe_id)
   * @returns {Promise<Array>} Liste des séances enrichies avec infos visio
   */
  async getUpcomingSeances(filters = {}) {
    try {
      const response = await api.get(endpoints.lms.seances.upcoming, { params: filters })
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération séances à venir:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les visioconférences de l'étudiant (prévues + en cours)
   * @returns {Promise<Array>} Liste des visioconférences
   */
  async getMyVisioConferences() {
    try {
      const response = await api.get(endpoints.lms.seances.myClasses)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération mes visioconférences:', error)
      throw error
    }
  }
}

export default klassciSeancesService
