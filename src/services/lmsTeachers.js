import api from './api'

/**
 * Service LMS — domaine ENSEIGNANTS (`/lms/enseignants`, dashboard enseignant).
 *
 * NOTE intercepteur : api.js retourne déjà response.data (ne pas refaire .data ici).
 */
export const lmsTeachersService = {
  /**
   * Récupérer tous les enseignants (via LMS + KLASSCI)
   * @param {boolean} withDetails - Inclure détails complets (classes, matières, stats)
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getEnseignants(withDetails = false) {
    try {
      const url = withDetails ? '/lms/enseignants?with_details=true' : '/lms/enseignants'
      return await api.get(url)
    } catch (error) {
      console.error('Erreur récupération enseignants:', error)
      throw error
    }
  },

  /**
   * Récupérer le dashboard enseignant (matières, classes, stats)
   * @returns {Promise<Object>} { success, data: { matieres, classes, stats } }
   */
  async getTeacherDashboard() {
    try {
      return await api.get('/proxy/me/teacher-dashboard')
    } catch (error) {
      console.error('Erreur récupération dashboard enseignant:', error)
      throw error
    }
  }
}

export default lmsTeachersService
