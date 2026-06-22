/**
 * Domaine KLASSCI — structure académique brute (G9 — split de klassci.js).
 *
 * Passe-plat vers les endpoints `/proxy/*` : classes, matières, enseignants,
 * emploi du temps, structure organisationnelle. Données KLASSCI BRUTES (pour la
 * donnée enrichie LMS, utiliser lmsService). Comportement et payloads
 * STRICTEMENT identiques à l'original.
 */
import api from './api'

export const klassciStructureService = {
  /**
   * Récupérer toutes les classes depuis KLASSCI
   * @returns {Promise<Array>} Liste des classes
   */
  async getClasses() {
    try {
      const response = await api.get('/proxy/classes')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération classes:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les matières depuis KLASSCI
   * @returns {Promise<Array>} Liste des matières
   */
  async getMatieres() {
    try {
      const response = await api.get('/proxy/matieres')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération matières:', error)
      throw error
    }
  },

  /**
   * Récupérer tous les enseignants depuis KLASSCI
   * @returns {Promise<Array>} Liste des enseignants
   */
  async getEnseignants() {
    try {
      const response = await api.get('/proxy/enseignants')
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération enseignants:', error)
      throw error
    }
  },

  /**
   * Récupérer l'emploi du temps depuis KLASSCI
   * @param {Object} filters - Filtres optionnels (classe_id, enseignant_id, etc.)
   * @returns {Promise<Array>} Liste des séances d'emploi du temps
   */
  async getEmploiTemps(filters = {}) {
    try {
      const response = await api.get('/proxy/emploi-temps', { params: filters })
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération emploi du temps:', error)
      throw error
    }
  },

  /**
   * Récupérer les détails d'une classe spécifique
   * @param {number} classeId - ID de la classe
   * @returns {Promise<Object>} Détails de la classe
   */
  async getClasseDetails(classeId) {
    try {
      const response = await api.get(`/proxy/classes/${classeId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error(`Erreur récupération classe ${classeId}:`, error)
      throw error
    }
  },

  /**
   * Récupérer les étudiants d'une classe
   * @param {number} classeId - ID de la classe
   * @returns {Promise<Array>} Liste des étudiants
   */
  async getClasseEtudiants(classeId) {
    try {
      const response = await api.get(`/proxy/classes/${classeId}/etudiants`)
      return response.success ? response.data : []
    } catch (error) {
      console.error(`Erreur récupération étudiants classe ${classeId}:`, error)
      throw error
    }
  },

  /**
   * Récupérer la structure organisationnelle (filières, niveaux) depuis KLASSCI
   * @returns {Promise<Object>} Structure avec filieres et niveaux_etude
   */
  async getStructure() {
    try {
      const response = await api.get('/proxy/structure')
      return response.success ? response.data : { filieres: [], niveaux_etude: [] }
    } catch (error) {
      console.error('Erreur récupération structure:', error)
      throw error
    }
  },

  // Alias pour compatibilité (AdminSeances.vue utilise getTeachers)
  async getTeachers() {
    return this.getEnseignants()
  }
}

export default klassciStructureService
