/**
 * Domaine KLASSCI — vues admin enrichies (G9 — split de klassci.js).
 *
 * Enseignants enrichis LMS (`/lms/enseignants`) et matières admin combinées
 * (`/admin/matieres`). Comportement et payloads STRICTEMENT identiques à
 * l'original.
 */
import api from './api'
import { endpoints } from './endpoints'

const getWithOptionalConfig = (url, config = {}) =>
  Object.keys(config).length > 0 ? api.get(url, config) : api.get(url)

export const klassciAdminService = {
  /**
   * Récupérer la liste des enseignants depuis le LMS (avec classes, matières, stats, etc.)
   * @param {Object} params - Paramètres optionnels
   * @param {boolean} params.with_details - Activer le format enrichi (défaut: false)
   * @param {number} params.filiere_id - Filtrer par filière
   * @param {number} params.niveau_id - Filtrer par niveau
   * @param {number} params.classe_id - Filtrer par classe
   * @param {number} params.matiere_id - Filtrer par matière
   * @returns {Promise<Object>} Liste des enseignants avec données LMS
   *
   * Format simple (with_details=false):
   * { success: true, data: [{ id, teacher_id, nom, email, role, matricule, specialization, status }] }
   *
   * Format enrichi (with_details=true):
   * { success: true, data: [{
   *   id, teacher_id, nom, email, role, matricule, specialization, status,
   *   classes: [{ id, nom, filiere: {...}, niveau: {...} }],
   *   matieres: [{ id, nom, code, heures_prevues, heures_effectuees, heures_restantes,
   *                taux_realisation, nb_seances_total, nb_seances_effectuees,
   *                classes: [...], seances: [...] }],
   *   statistiques: { total_classes, total_matieres, total_heures_prevues,
   *                   total_heures_effectuees, total_heures_restantes,
   *                   taux_realisation_global, nb_seances_total, nb_seances_effectuees }
   * }] }
   */
  async getLmsEnseignants(params = {}) {
    try {
      const response = await api.get(endpoints.lms.enseignants, { params })
      return response // Retourne l'objet complet avec success, data, etc.
    } catch (error) {
      console.error('[KlassciService] Erreur récupération enseignants LMS:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les matières avec combinaisons complètes (admin/coordinateur)
   * @returns {Promise<Object>} Liste des matières enrichies
   */
  async getAdminMatieres(config = {}) {
    try {
      const response = await getWithOptionalConfig(endpoints.admin.matieres, config)
      return response
    } catch (error) {
      console.error('Erreur récupération matières admin:', error)
      throw error
    }
  }
}

export default klassciAdminService
