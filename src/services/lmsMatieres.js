import api from './api'

/**
 * Service LMS — domaine MATIÈRES (données enrichies `/lms/matieres/*`, `/lms/teacher/*`).
 * Source UNIQUE des détails matière enrichis (#26).
 *
 * NOTE intercepteur : api.js retourne déjà response.data (ne pas refaire .data ici).
 */
export const lmsMatieresService = {
  /**
   * Récupérer détails complets d'une matière
   * (KLASSCI + Lessons LMS + Séances + Évaluations)
   * @param {number} matiereId
   * @returns {Promise<Object>} { success, data: { matiere, lessons, seances_programmees, evaluations_programmees, statistiques } }
   */
  async getMatiereDetails(matiereId) {
    try {
      return await api.get(`/lms/matieres/${matiereId}`)
    } catch (error) {
      console.error('Erreur récupération matière enrichie:', error)
      throw error
    }
  },

  /**
   * Récupérer les matières de l'enseignant avec statistiques enrichies
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getMyMatieres() {
    try {
      return await api.get('/lms/teacher/my-matieres')
    } catch (error) {
      console.error('Erreur récupération mes matières:', error)
      throw error
    }
  }
}

export default lmsMatieresService
