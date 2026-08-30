/**
 * Domaine KLASSCI — structure académique brute (G9 — split de klassci.js).
 *
 * Passe-plat vers les endpoints `/proxy/*` : classes, matières, enseignants,
 * emploi du temps, structure organisationnelle. Données KLASSCI BRUTES (pour la
 * donnée enrichie LMS, utiliser lmsService). Comportement et payloads
 * STRICTEMENT identiques à l'original.
 */
import api from './api'
import { endpoints } from './endpoints'

const getWithOptionalConfig = (url, config = {}) =>
  Object.keys(config).length > 0 ? api.get(url, config) : api.get(url)

export const klassciStructureService = {
  /**
   * Récupérer toutes les classes depuis KLASSCI
   * @returns {Promise<Array>} Liste des classes
   */
  async getClasses(config = {}) {
    try {
      const response = await getWithOptionalConfig(endpoints.klassci.classes, config)
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
  async getMatieres(config = {}) {
    try {
      const response = await getWithOptionalConfig(endpoints.klassci.matieres, config)
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
      const response = await api.get(endpoints.klassci.enseignants)
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
      const response = await api.get(endpoints.klassci.emploiTemps, { params: filters })
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération emploi du temps:', error)
      throw error
    }
  },

  /**
   * Récupérer les étudiants d'une classe
   * @param {number} classeId - ID de la classe
   * @returns {Promise<Array>} Liste des étudiants
   */
  async getClasseEtudiants(classeId, config = {}) {
    try {
      const response = await getWithOptionalConfig(endpoints.klassci.classeEtudiants(classeId), config)
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
  async getStructure(config = {}) {
    try {
      const response = await getWithOptionalConfig(endpoints.klassci.structure, config)
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
