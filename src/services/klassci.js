/**
 * Service pour interagir avec les données KLASSCI via le proxy LMS
 */
import api from './api'

export const klassciService = {
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
   * Récupérer les détails d'une matière spécifique
   * @param {number} matiereId - ID de la matière
   * @returns {Promise<Object>} Détails de la matière
   */
  async getMatiereDetails(matiereId) {
    try {
      const response = await api.get(`/proxy/matieres/${matiereId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error(`Erreur récupération matière ${matiereId}:`, error)
      throw error
    }
  },

  /**
   * Rechercher dans KLASSCI
   * @param {string} query - Terme de recherche
   * @param {string} type - Type de recherche (classes, matieres, etudiants, enseignants)
   * @returns {Promise<Array>} Résultats de recherche
   */
  async search(query, type = 'all') {
    try {
      const response = await api.get('/proxy/search', {
        params: { q: query, type }
      })
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur recherche KLASSCI:', error)
      throw error
    }
  },

  /**
   * Récupérer le dashboard complet de l'étudiant connecté depuis KLASSCI
   * Retourne: classe, cours (matières), quiz (évaluations), notes, statistiques
   * @returns {Promise<Object>} Dashboard complet de l'étudiant
   */
  async getStudentDashboard() {
    try {
      const response = await api.get('/proxy/me/dashboard')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération dashboard étudiant:', error)
      throw error
    }
  },

  /**
   * Récupérer le dashboard complet de l'enseignant connecté depuis KLASSCI
   * Retourne: matieres, classes, evaluations, seances, statistiques
   * @returns {Promise<Object>} Dashboard complet de l'enseignant
   */
  async getTeacherDashboard() {
    try {
      const response = await api.get('/proxy/me/teacher-dashboard')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Erreur récupération dashboard enseignant:', error)
      throw error
    }
  },

  /**
   * Récupérer les évaluations depuis KLASSCI
   * @param {Object} filters - Filtres optionnels (matiere_id, classe_id, statut)
   * @returns {Promise<Object>} Évaluations avec success flag
   */
  async getEvaluations(filters = {}) {
    try {
      const response = await api.get('/proxy/evaluations', { params: filters })
      return { success: true, data: response.data || response }
    } catch (error) {
      console.error('Erreur récupération évaluations KLASSCI:', error)
      throw error
    }
  }
}

export default klassciService
