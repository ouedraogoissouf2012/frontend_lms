/**
 * Domaine KLASSCI — dashboards (G9 — split de klassci.js).
 *
 * Dashboards complets élève/enseignant (`/proxy/me/*`) et matières dérivées du
 * dashboard élève. Comportement et payloads STRICTEMENT identiques à l'original.
 */
import api from './api'
import { endpoints } from './endpoints'

export const klassciDashboardService = {
  /**
   * Récupérer le dashboard complet de l'étudiant connecté depuis KLASSCI
   * Retourne: classe, cours (matières), quiz (évaluations), notes, statistiques
   * @returns {Promise<Object>} Dashboard complet de l'étudiant
   */
  async getStudentDashboard() {
    try {
      const response = await api.get(endpoints.klassci.studentDashboard)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération dashboard étudiant:', error)
      throw error
    }
  },

  /**
   * Récupérer le dashboard complet de l'enseignant connecté depuis KLASSCI
   * Retourne: matieres, classes, evaluations, seances, statistiques
   * @returns {Promise<Object>} Dashboard complet de l'enseignant
   */
  async getTeacherDashboard() {
    const response = await api.get(endpoints.klassci.teacherDashboard)
    return response.success ? response.data : null
  },

  /**
   * Récupérer les matières de l'étudiant (depuis dashboard KLASSCI)
   * @returns {Promise<Array>} Liste des matières
   */
  async getMyMatieres() {
    try {
      const dashboard = await this.getStudentDashboard()
      return dashboard?.cours || []
    } catch (error) {
      console.error('Erreur récupération mes matières:', error)
      throw error
    }
  }
}

export default klassciDashboardService
