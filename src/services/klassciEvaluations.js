/**
 * Domaine KLASSCI — évaluations (G9 — split de klassci.js).
 *
 * Évaluations KLASSCI (`/proxy/evaluations`) et évaluations de l'élève connecté
 * (`/evaluations/student`). Comportement et payloads STRICTEMENT identiques à
 * l'original.
 */
import api from './api'

export const klassciEvaluationsService = {
  /**
   * Récupérer les évaluations depuis KLASSCI
   * @param {Object} filters - Filtres optionnels (matiere_id, classe_id, statut)
   * @returns {Promise<Object>} Évaluations avec success flag
   */
  async getEvaluations(filters = {}) {
    try {
      const response = await api.get('/proxy/evaluations', { params: filters })
      return { success: true, data: response.data || response }
    } catch (error) {
      console.error('Erreur récupération évaluations KLASSCI:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les évaluations de l'étudiant connecté (toutes matières confondues)
   * @returns {Promise<Array>} Liste des évaluations
   */
  async getMyEvaluations() {
    try {
      const response = await api.get('/evaluations/student')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération mes évaluations:', error)
      throw error
    }
  }
}

export default klassciEvaluationsService
