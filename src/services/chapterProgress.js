import api from './api'
import { endpoints } from './endpoints'

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
      const response = await api.get(endpoints.lessons.progress(lessonId))
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
      const response = await api.get(endpoints.chapters.progress(chapterId))
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
      const response = await api.post(endpoints.chapters.complete(chapterId), {
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
      const response = await api.post(endpoints.chapters.time(chapterId), {
        time_spent_seconds: timeSpentSeconds
      })
      return response
    } catch (error) {
      console.error('[ChapterProgressService] Erreur updateTimeSpent:', error)
      throw error
    }
  }
  // resetLessonProgress supprimée (#17 Ék-12) : route DELETE /lessons/{id}/progress
  // inexistante côté backend, aucun consommateur.
}

export default chapterProgressService
