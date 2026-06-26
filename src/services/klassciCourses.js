/**
 * Domaine KLASSCI — cours (leçons) de l'élève (G9 — split de klassci.js).
 *
 * Vrais cours de l'élève avec enseignant et matière (`/lessons/my-courses`).
 * Comportement, construction de l'URL (query string) et payloads STRICTEMENT
 * identiques à l'original.
 */
import api from './api'
import { endpoints } from './endpoints'

export const klassciCoursesService = {
  /**
   * Récupérer les vrais cours (leçons) de l'étudiant avec enseignant et matière
   * @param {Object} filters - Filtres optionnels { matiere_id, enseignant_id }
   * @returns {Promise<Object>} { data: cours[], filters: { matieres, enseignants }, total }
   */
  async getMyCourses(filters = {}) {
    try {
      const params = new URLSearchParams()
      if (filters.matiere_id) params.append('matiere_id', filters.matiere_id)
      if (filters.enseignant_id) params.append('enseignant_id', filters.enseignant_id)

      const queryString = params.toString()
      const url = queryString ? `${endpoints.lessons.myCourses}?${queryString}` : endpoints.lessons.myCourses

      const response = await api.get(url)
      return response.success ? response : { data: [], filters: { matieres: [], enseignants: [] }, total: 0 }
    } catch (error) {
      console.error('Erreur récupération mes cours:', error)
      throw error
    }
  }
}

export default klassciCoursesService
