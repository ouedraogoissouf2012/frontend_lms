/**
 * Domaine KLASSCI — évaluations (G9 — split de klassci.js).
 *
 * Évaluations KLASSCI (`/proxy/evaluations`) et évaluations de l'élève connecté
 * (`/evaluations/student`). Comportement et payloads STRICTEMENT identiques à
 * l'original.
 */
import api from './api'
import { endpoints } from './endpoints'
// Relatif, pas `@/` : ce service est dans le graphe du runner de contrat natif.
import { invalidResponseError } from './errorHandler'

export const klassciEvaluationsService = {
  /**
   * Récupérer les évaluations depuis KLASSCI
   * @param {Object} filters - Filtres optionnels (matiere_id, classe_id, statut)
   * @returns {Promise<{ success: true, data: Array }>} la liste reçue
   * @throws {Error} avec `userMessage` : erreur HTTP ou réseau (intercepteur
   *   d'`api.js`), ou enveloppe non conforme.
   */
  async getEvaluations(filters = {}) {
    try {
      const response = await api.get(endpoints.klassci.evaluations, { params: filters })
      // Forme mesurée : `{ success: true, data: [] }`. Le serveur relaie le corps de
      // KLASSCI tel quel : sans `success: true` ni liste, c'est une anomalie à
      // afficher, jamais une liste fabriquée (modèle : klassciCourses, #436).
      if (response?.success !== true || !Array.isArray(response.data)) {
        throw invalidResponseError('GET /proxy/evaluations sans success ni liste')
      }
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Erreur récupération évaluations KLASSCI:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les évaluations de l'étudiant connecté (toutes matières confondues)
   * @returns {Promise<Array>} Liste des évaluations
   */
  async getMyEvaluations() {
    try {
      const response = await api.get(endpoints.evaluations.student)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Erreur récupération mes évaluations:', error)
      throw error
    }
  }
}

export default klassciEvaluationsService
