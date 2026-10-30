import api from './api'
import { endpoints } from './endpoints'
// Relatif, pas `@/` : ce service est dans le graphe du runner de contrat natif.
import { invalidResponseError, isCanceled, logError } from './errorHandler'

/**
 * Service de recherche globale
 */
export const searchService = {
  /**
   * Recherche globale dans le système.
   * @param {{ signal?: AbortSignal }} [options] `signal` annule la requête en vol.
   * @throws {Error} avec `userMessage` : panne (dont le 429 de `throttle:search`) ou
   *   réponse non conforme — jamais `null`, que l'écran prenait pour « rien de neuf »
   *   en gardant les résultats de la requête précédente.
   */
  async globalSearch(query, limit = 5, { signal } = {}) {
    try {
      const response = await api.get(endpoints.search.query, {
        params: { query, limit },
        signal,
      })
      if (response?.success !== true || !response.results || typeof response.results !== 'object') {
        throw invalidResponseError('GET /search sans success ni résultats')
      }
      return response
    } catch (error) {
      if (!isCanceled(error)) console.error('Erreur recherche globale:', error)
      throw error
    }
  },

  /**
   * Obtenir des suggestions (autocomplete)
   */
  async getSuggestions(query) {
    try {
      const response = await api.get(endpoints.search.suggestions, {
        params: { query }
      })

      if (response?.success !== true || !Array.isArray(response.suggestions)) {
        throw invalidResponseError('GET /search/suggestions sans success ni liste')
      }
      return response.suggestions
    } catch (error) {
      console.error('Erreur suggestions:', error)
      throw error
    }
  },

  /**
   * Obtenir l'historique de recherche
   */
  async getSearchHistory() {
    try {
      const response = await api.get(endpoints.search.history)
      if (response?.success !== true || !Array.isArray(response.history)) {
        throw invalidResponseError('GET /search/history sans success ni liste')
      }
      return response.history
    } catch (error) {
      console.error('Erreur historique:', error)
      throw error
    }
  },

  /**
   * Sauvegarder une recherche dans l'historique
   */
  async saveToHistory(query) {
    try {
      const response = await api.post(endpoints.search.history, { query })
      return response.success
    } catch (error) {
      // Tolérant à dessein : un historique non sauvegardé ne doit pas gêner la recherche.
      logError(error, '[searchService] sauvegarde historique')
      return false
    }
  }
}

export default searchService
