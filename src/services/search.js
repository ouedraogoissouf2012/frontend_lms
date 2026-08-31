import api from './api'
import { endpoints } from './endpoints'

/**
 * Service de recherche globale
 */
export const searchService = {
  /**
   * Recherche globale dans le système
   */
  async globalSearch(query, limit = 5) {
    try {
      const response = await api.get(endpoints.search.query, {
        params: { query, limit }
      })

      return response.success ? response : null
    } catch (error) {
      console.error('Erreur recherche globale:', error)
      return null
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

      return response.success ? response.suggestions : []
    } catch (error) {
      console.error('Erreur suggestions:', error)
      return []
    }
  },

  /**
   * Obtenir l'historique de recherche
   */
  async getSearchHistory() {
    try {
      const response = await api.get(endpoints.search.history)
      return response.success ? response.history : []
    } catch (error) {
      console.error('Erreur historique:', error)
      return []
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
      console.error('Erreur sauvegarde historique:', error)
      return false
    }
  }
}

export default searchService
