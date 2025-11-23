import api from './api'

/**
 * Service pour gérer les évaluations
 */
export default {
  /**
   * Récupère toutes les évaluations avec filtres
   */
  async getEvaluations(filters = {}) {
    try {
      // L'intercepteur api.js retourne déjà response.data, donc pas besoin de .data ici
      const response = await api.get('/evaluations', { params: filters })
      return response
    } catch (error) {
      console.error('Erreur récupération évaluations:', error)
      throw error
    }
  },

  /**
   * Récupère une évaluation spécifique
   */
  async getEvaluation(id) {
    try {
      const response = await api.get(`/evaluations/${id}`)
      return response
    } catch (error) {
      console.error('Erreur récupération évaluation:', error)
      throw error
    }
  },

  /**
   * Récupère les évaluations disponibles pour un étudiant
   */
  async getStudentEvaluations(klassciEtudiantId) {
    try {
      const response = await api.get(`/evaluations/student/${klassciEtudiantId}`)
      return response
    } catch (error) {
      console.error('Erreur récupération évaluations étudiant:', error)
      throw error
    }
  },

  /**
   * Crée une nouvelle évaluation
   */
  async createEvaluation(data) {
    try {
      const response = await api.post('/evaluations', data)
      return response
    } catch (error) {
      console.error('Erreur création évaluation:', error)
      throw error
    }
  },

  /**
   * Met à jour une évaluation
   */
  async updateEvaluation(id, data) {
    try {
      const response = await api.put(`/evaluations/${id}`, data)
      return response
    } catch (error) {
      console.error('Erreur mise à jour évaluation:', error)
      throw error
    }
  },

  /**
   * Supprime une évaluation
   */
  async deleteEvaluation(id) {
    try {
      const response = await api.delete(`/evaluations/${id}`)
      return response
    } catch (error) {
      console.error('Erreur suppression évaluation:', error)
      throw error
    }
  },

  /**
   * Publie une évaluation
   */
  async publishEvaluation(id) {
    try {
      const response = await api.post(`/evaluations/${id}/publish`)
      return response
    } catch (error) {
      console.error('Erreur publication évaluation:', error)
      throw error
    }
  },

  /**
   * Démarre une évaluation pour un étudiant
   */
  async startEvaluation(id, klassciEtudiantId) {
    try {
      const response = await api.post(`/evaluations/${id}/start`, {
        klassci_etudiant_id: klassciEtudiantId
      })
      return response
    } catch (error) {
      console.error('Erreur démarrage évaluation:', error)
      throw error
    }
  },

  /**
   * Soumet les réponses d'une évaluation
   */
  async submitEvaluation(id, submissionId, answers) {
    try {
      const response = await api.post(`/evaluations/${id}/submit`, {
        submission_id: submissionId,
        answers: answers
      })
      return response
    } catch (error) {
      console.error('Erreur soumission évaluation:', error)
      throw error
    }
  },

  /**
   * Synchronise les notes vers KLASSCI
   */
  async syncToKlassci(id) {
    try {
      const response = await api.post(`/evaluations/${id}/sync-to-klassci`)
      return response
    } catch (error) {
      console.error('Erreur synchronisation KLASSCI:', error)
      throw error
    }
  },

  /**
   * Récupère l'état temporel en temps réel
   */
  async getTimeStatus(id) {
    try {
      const response = await api.get(`/evaluations/${id}/time-status`)
      return response
    } catch (error) {
      console.error('Erreur récupération état temporel:', error)
      throw error
    }
  },

  /**
   * Récupère les résultats détaillés d'une évaluation avec tous les étudiants de la classe
   * (Coordinateur/Admin/Enseignant uniquement)
   */
  async getEvaluationResultsByClass(id) {
    try {
      const response = await api.get(`/evaluations/${id}/results-by-class`)
      return response
    } catch (error) {
      console.error('Erreur récupération résultats évaluation:', error)
      throw error
    }
  },

  /**
   * Alias pour getEvaluationResultsByClass (pour compatibilité)
   */
  async getResultsByClass(id) {
    return this.getEvaluationResultsByClass(id)
  }
}
