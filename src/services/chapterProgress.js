import api from './api'

/**
 * Service pour la progression des chapitres
 */
const chapterProgressService = {
  /**
   * Obtenir la progression d'une lecon
   * @param {number} lessonId - ID de la lecon
   * @returns {Promise}
   */
  async getLessonProgress(lessonId) {
    try {
      const response = await api.get(`/lessons/${lessonId}/progress`)
      return response
    } catch (error) {
      console.error('[ChapterProgressService] Erreur getLessonProgress:', error)
      throw error
    }
  },

  /**
   * Obtenir la progression d'un chapitre
   * @param {number} chapterId - ID du chapitre
   * @returns {Promise}
   */
  async getChapterProgress(chapterId) {
    try {
      const response = await api.get(`/chapters/${chapterId}/progress`)
      return response
    } catch (error) {
      console.error('[ChapterProgressService] Erreur getChapterProgress:', error)
      throw error
    }
  },

  /**
   * Marquer un chapitre comme complete
   * @param {number} chapterId - ID du chapitre
   * @param {number} timeSpentSeconds - Temps passe en secondes (optionnel)
   * @returns {Promise}
   */
  async markAsCompleted(chapterId, timeSpentSeconds = 0) {
    try {
      const response = await api.post(`/chapters/${chapterId}/complete`, {
        time_spent_seconds: timeSpentSeconds
      })
      return response
    } catch (error) {
      console.error('[ChapterProgressService] Erreur markAsCompleted:', error)
      throw error
    }
  },

  /**
   * Mettre a jour le temps passe sur un chapitre
   * @param {number} chapterId - ID du chapitre
   * @param {number} timeSpentSeconds - Temps passe en secondes
   * @returns {Promise}
   */
  async updateTimeSpent(chapterId, timeSpentSeconds) {
    try {
      const response = await api.post(`/chapters/${chapterId}/time`, {
        time_spent_seconds: timeSpentSeconds
      })
      return response
    } catch (error) {
      console.error('[ChapterProgressService] Erreur updateTimeSpent:', error)
      throw error
    }
  },

  /**
   * Reinitialiser la progression d'une lecon
   * @param {number} lessonId - ID de la lecon
   * @param {number} userId - ID de l'utilisateur (optionnel, admin seulement)
   * @returns {Promise}
   */
  async resetLessonProgress(lessonId, userId = null) {
    try {
      const response = await api.delete(`/lessons/${lessonId}/progress`, {
        data: userId ? { user_id: userId } : {}
      })
      return response
    } catch (error) {
      console.error('[ChapterProgressService] Erreur resetLessonProgress:', error)
      throw error
    }
  }
}

export default chapterProgressService
