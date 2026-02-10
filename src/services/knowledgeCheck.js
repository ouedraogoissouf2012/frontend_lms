import api from './api'

/**
 * Service pour les quiz "Testez vos connaissances"
 * ATTENTION: Ceci est SEPARE des Evaluations KLASSCI
 */
const knowledgeCheckService = {
  /**
   * Recuperer les quiz d'un chapitre
   * @param {number} chapterId - ID du chapitre
   * @returns {Promise}
   */
  async getByChapter(chapterId) {
    try {
      const response = await api.get('/knowledge-checks', {
        params: { chapter_id: chapterId }
      })
      return response
    } catch (error) {
      console.error('[KnowledgeCheckService] Erreur getByChapter:', error)
      throw error
    }
  },

  /**
   * Recuperer les details d'un quiz
   * @param {number} quizId - ID du quiz
   * @returns {Promise}
   */
  async get(quizId) {
    try {
      const response = await api.get(`/knowledge-checks/${quizId}`)
      return response
    } catch (error) {
      console.error('[KnowledgeCheckService] Erreur get:', error)
      throw error
    }
  },

  /**
   * Creer un nouveau quiz (Enseignant uniquement)
   * @param {Object} quizData - Donnees du quiz
   * @returns {Promise}
   */
  async create(quizData) {
    try {
      const response = await api.post('/knowledge-checks', quizData)
      return response
    } catch (error) {
      console.error('[KnowledgeCheckService] Erreur create:', error)
      throw error
    }
  },

  /**
   * Mettre a jour un quiz (Enseignant uniquement)
   * @param {number} quizId - ID du quiz
   * @param {Object} quizData - Donnees du quiz
   * @returns {Promise}
   */
  async update(quizId, quizData) {
    try {
      const response = await api.put(`/knowledge-checks/${quizId}`, quizData)
      return response
    } catch (error) {
      console.error('[KnowledgeCheckService] Erreur update:', error)
      throw error
    }
  },

  /**
   * Supprimer un quiz (Enseignant uniquement)
   * @param {number} quizId - ID du quiz
   * @returns {Promise}
   */
  async delete(quizId) {
    try {
      const response = await api.delete(`/knowledge-checks/${quizId}`)
      return response
    } catch (error) {
      console.error('[KnowledgeCheckService] Erreur delete:', error)
      throw error
    }
  },

  /**
   * Demarrer une tentative de quiz
   * @param {number} quizId - ID du quiz
   * @returns {Promise} - Questions sans les reponses correctes
   */
  async startAttempt(quizId) {
    try {
      const response = await api.post(`/knowledge-checks/${quizId}/start`)
      return response
    } catch (error) {
      console.error('[KnowledgeCheckService] Erreur startAttempt:', error)
      throw error
    }
  },

  /**
   * Soumettre les reponses d'une tentative
   * @param {number} quizId - ID du quiz
   * @param {Array} answers - Reponses de l'utilisateur
   * @param {number} timeSpentSeconds - Temps passe en secondes
   * @returns {Promise} - Resultats avec score et corrections
   */
  async submitAttempt(quizId, answers, timeSpentSeconds) {
    try {
      const response = await api.post(`/knowledge-checks/${quizId}/submit`, {
        answers,
        time_spent_seconds: timeSpentSeconds
      })
      return response
    } catch (error) {
      console.error('[KnowledgeCheckService] Erreur submitAttempt:', error)
      throw error
    }
  },

  /**
   * Recuperer l'historique de ses tentatives
   * @param {number} quizId - ID du quiz
   * @returns {Promise}
   */
  async getMyAttempts(quizId) {
    try {
      const response = await api.get(`/knowledge-checks/${quizId}/my-attempts`)
      return response
    } catch (error) {
      console.error('[KnowledgeCheckService] Erreur getMyAttempts:', error)
      throw error
    }
  },

  /**
   * Obtenir le badge de score
   * @param {number} score - Score en pourcentage
   * @param {number} passingScore - Score de reussite
   * @returns {Object} - { class, text, icon }
   */
  getScoreBadge(score, passingScore = 70) {
    if (score >= passingScore) {
      return {
        class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        text: 'Reussi',
        icon: 'check_circle'
      }
    } else if (score >= passingScore - 20) {
      return {
        class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        text: 'A ameliorer',
        icon: 'warning'
      }
    } else {
      return {
        class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        text: 'A revoir',
        icon: 'cancel'
      }
    }
  },

  /**
   * Types de questions disponibles
   */
  getQuestionTypes() {
    return [
      { value: 'single', label: 'Choix unique', icon: 'radio_button_checked' },
      { value: 'multiple', label: 'Choix multiple', icon: 'check_box' },
      { value: 'true_false', label: 'Vrai / Faux', icon: 'swap_horiz' }
    ]
  },

  /**
   * Creer une question vide
   * @param {string} type - Type de question
   * @returns {Object}
   */
  createEmptyQuestion(type = 'single') {
    const baseQuestion = {
      question: '',
      type,
      options: ['', ''],
      correct_answer: type === 'multiple' ? [] : null,
      explanation: '',
      points: 1
    }

    if (type === 'true_false') {
      baseQuestion.options = ['Vrai', 'Faux']
    }

    return baseQuestion
  }
}

export default knowledgeCheckService
