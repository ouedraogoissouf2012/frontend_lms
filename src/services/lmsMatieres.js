import api from './api'
import { endpoints } from './endpoints'
// #296 : normalisation d'enveloppe à la frontière (import RELATIF — contrat).
import { extractList } from '../utils/apiList'

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
      return await api.get(endpoints.lms.matieres.details(matiereId))
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
      // #296 : dé-wrap à la frontière → tableau canonique.
      return extractList(await api.get(endpoints.lms.matieres.myTeacher), ['matieres'])
    } catch (error) {
      console.error('Erreur récupération mes matières:', error)
      throw error
    }
  }
}

export default lmsMatieresService
