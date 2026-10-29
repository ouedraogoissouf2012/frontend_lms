/**
 * Domaine KLASSCI — cours (leçons) de l'élève (G9 — split de klassci.js).
 *
 * Vrais cours de l'élève avec enseignant et matière (`/lessons/my-courses`).
 * Construction de l'URL (query string) identique à l'original du découpage G9.
 * Une différence volontaire depuis #436 : une réponse sans `success: true` est
 * REJETÉE (erreur affichable), au lieu d'être remplacée par une liste vide.
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
// Relatif, pas `@/` : ce service est dans le graphe du runner de contrat natif.
import { invalidResponseError } from './errorHandler'

export const klassciCoursesService = {
  /**
   * Récupérer les vrais cours (leçons) de l'étudiant avec enseignant et matière
   * @param {Object} filters - Filtres optionnels { matiere_id, enseignant_id }
   * @param {number} [page] - Page demandée (#434). Omise ou 1 : première page,
   *   sans paramètre. Jamais de `per_page` : le serveur pagine à 15 (décision D1).
   * @returns {Promise<Object>} la réponse du serveur, telle quelle :
   *   `{ success: true, data: cours[], filters: { matieres, enseignants }, total,
   *   meta: { current_page, last_page, per_page, total } }` (forme D1, capturée
   *   dans `tests/fixtures/api/myCourses.js`).
   * @throws {Error} avec `userMessage` : erreur HTTP ou réseau (posée par
   *   l'intercepteur d'`api.js`), ou réponse sans `success: true` (#436).
   */
  async getMyCourses(filters = {}, page = 1) {
    try {
      const params = new URLSearchParams()
      if (filters.matiere_id) params.append('matiere_id', filters.matiere_id)
      if (filters.enseignant_id) params.append('enseignant_id', filters.enseignant_id)
      if (page > 1) params.append('page', page)

      const queryString = params.toString()
      const url = queryString ? `${endpoints.lessons.myCourses}?${queryString}` : endpoints.lessons.myCourses

      const response = await api.get(url)
      // La réponse porte toujours `success: true` (#436) : son absence est une
      // anomalie à afficher, jamais une liste vide (« aucun cours publié »).
      if (response?.success !== true) throw invalidResponseError('GET /lessons/my-courses sans success')
      return response
    } catch (error) {
      console.error('Erreur récupération mes cours:', error)
      throw error
    }
  }
}

export default klassciCoursesService
