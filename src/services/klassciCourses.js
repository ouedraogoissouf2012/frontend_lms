/**
 * Domaine KLASSCI — cours (leçons) de l'élève (G9 — split de klassci.js).
 *
 * Vrais cours de l'élève avec enseignant et matière (`/lessons/my-courses`).
 * Comportement, construction de l'URL (query string) et payloads STRICTEMENT
 * identiques à l'original.
 *
 * ## ⚠️ Le nom est trompeur, et c'est important (#329)
 *
 * Ce service porte « klassci » mais appelle un endpoint **LOCAL** :
 * `endpoints.lessons.myCourses` = `/lessons/my-courses`, servi par le LMS.
 * Il ne franchit **jamais** la frontière `/proxy/*`.
 *
 * Conséquence pour le chantier V2 (épique #325) : le contenu de l'élève est
 * déjà authentiquement autonome. Le seul obstacle en mode autonome est le pont
 * d'inscription, pas ce service.
 *
 * Le piège existait dans les deux sens : `lmsTeachers.js` portait « lms » et
 * appelait `/proxy` — supprimé en #329, et une garde de contrat interdit
 * désormais à tout service `lms*` de franchir la frontière. **Le nom d'un
 * service ne dit rien de ce qu'il appelle : seul `endpoints.klassci.*` fait
 * foi.**
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
