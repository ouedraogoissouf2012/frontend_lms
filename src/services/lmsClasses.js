import api from './api'
import { extractList } from '../utils/apiList'
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
  async getTeacherClasses() {
    return extractList(await api.get(endpoints.lms.classes.mine))
  },

  async getClasseDetails(classeId) {
    try {
      return await api.get(endpoints.lms.classes.details(classeId))
    } catch (error) {
      console.error('Erreur récupération classe enrichie:', error)
      throw error
    }
  },

  /**
   * Meme classe, meme charge utile — mais designee par son identifiant LOCAL.
   *
   * Jumelle de `getClasseDetails`, qui parle l'espace KLASSCI. Les deux espaces
   * entrent en collision : mesure du 19/09/2026, sur 21 classes une SEULE porte
   * le meme nombre des deux cotes. Choisir la mauvaise porte affiche la fiche
   * d'une autre classe, en 200, sans erreur (backend #760, ADR-760-01).
   *
   * @param {number} classeId identifiant LOCAL
   */
  async getClasseDetailsLocal(classeId) {
    try {
      return await api.get(endpoints.lms.classes.detailsLocal(classeId))
    } catch (error) {
      console.error('Erreur récupération classe (espace local):', error)
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
