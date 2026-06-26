import api from './api'
import { endpoints } from './endpoints'

/**
 * Service LMS — domaine CLASSES (données enrichies `/lms/classes/*`).
 * Frontière (#26) : données enrichies LMS. Pour la liste brute des classes
 * KLASSCI, utiliser klassciService.getClasses (`/proxy/classes`).
 *
 * NOTE intercepteur : api.js retourne déjà response.data (ne pas refaire .data ici).
 */
export const lmsClassesService = {
  /**
   * Récupérer détails complets d'une classe (KLASSCI + données LMS)
   * @param {number} classeId
   * @returns {Promise<Object>}
   */
  async getClasseDetails(classeId) {
    try {
      return await api.get(endpoints.lms.classes.details(classeId))
    } catch (error) {
      console.error('Erreur récupération classe enrichie:', error)
      throw error
    }
  },

  /**
   * Récupérer les étudiants d'une classe
   * @param {number} classeId
   * @returns {Promise<Object>} { success, data: { etudiants } }
   */
  async getClasseEtudiants(classeId) {
    try {
      return await api.get(endpoints.lms.classes.etudiants(classeId))
    } catch (error) {
      console.error('Erreur récupération étudiants classe:', error)
      throw error
    }
  }
}

export default lmsClassesService
