import api from './api'
import { endpoints } from './endpoints'

/**
 * Service pour gérer les évaluations.
 *
 * Chemins centralisés via `endpoints.evaluations` (#105/#110 — source unique des
 * URLs). Frontière LMS ENRICHIE `/evaluations/*` ≠ `/proxy/evaluations` brut KLASSCI.
 */
export default {
  /**
   * Récupère toutes les évaluations avec filtres
   */
  async getEvaluations(filters = {}) {
    try {
      // L'intercepteur api.js retourne déjà response.data, donc pas besoin de .data ici
      const response = await api.get(endpoints.evaluations.list, { params: filters })
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
      const response = await api.get(endpoints.evaluations.details(id))
      return response
    } catch (error) {
      console.error('Erreur récupération évaluation:', error)
      throw error
    }
  },

  /**
   * Récupère les évaluations de l'étudiant CONNECTÉ.
   * Anti-IDOR (#17 Ék-6) : aucun identifiant côté client — l'identité est dérivée
   * du token côté backend. La route paramétrée /evaluations/student/{id} a été
   * supprimée côté backend (vecteur IDOR). Ne JAMAIS réintroduire de segment d'ID.
   */
  async getStudentEvaluations() {
    try {
      const response = await api.get(endpoints.evaluations.student)
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
      const response = await api.post(endpoints.evaluations.list, data)
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
      const response = await api.put(endpoints.evaluations.details(id), data)
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
      const response = await api.delete(endpoints.evaluations.details(id))
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
      const response = await api.post(endpoints.evaluations.publish(id))
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
      const response = await api.post(endpoints.evaluations.start(id), {
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
      const response = await api.post(endpoints.evaluations.submit(id), {
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
      const response = await api.post(endpoints.evaluations.syncKlassci(id))
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
      const response = await api.get(endpoints.evaluations.timeStatus(id))
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
      const response = await api.get(endpoints.evaluations.resultsByClass(id))
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
  },

  /**
   * Prévisualise une évaluation (enseignant)
   */
  async previewEvaluation(id) {
    try {
      const response = await api.get(endpoints.evaluations.preview(id))
      return response
    } catch (error) {
      console.error('Erreur prévisualisation évaluation:', error)
      throw error
    }
  }
}
