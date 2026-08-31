import api from './api'
// Import relatif : ce service est chargé par le runner natif des tests de contrat (#17).
import { formatDuration as fmtDuration } from '../utils/formatters'
import { endpoints } from './endpoints'

/**
 * Service pour la gestion des chapitres (Chapters)
 */
const chapterService = {
  /**
   * Récupérer les chapitres d'une leçon.
   * Le backend expose uniquement l'index leçon-scopé : GET /lessons/{id}/chapters.
   * @param {Number|String} lessonId - Leçon parente (segment d'URL, obligatoire)
   * @returns {Promise}
   */
  async getChapters(lessonId) {
    if (!lessonId) {
      throw new Error('[ChapterService] lessonId requis pour charger les chapitres')
    }
    try {
      const response = await api.get(endpoints.chapters.ofLesson(lessonId))
      return response.data
    } catch (error) {
      console.error('[ChapterService] Erreur getChapters:', error)
      throw error
    }
  },

  /**
   * Récupérer les détails d'un chapitre
   * @param {Number} chapterId
   * @returns {Promise}
   */
  async getChapter(chapterId) {
    try {
      const response = await api.get(endpoints.chapters.details(chapterId))
      return response.data
    } catch (error) {
      console.error('[ChapterService] Erreur getChapter:', error)
      throw error
    }
  },

  /**
   * Créer un nouveau chapitre rattaché à une leçon (Enseignant uniquement)
   * @param {Number} lessonId - Leçon parente (segment d'URL, obligatoire)
   * @param {Object} chapterData - Champs FR attendus par StoreChapterRequest :
   *   titre, description, ordre, type_contenu, fichier (multipart si présent)
   * @returns {Promise}
   */
  async createChapter(lessonId, chapterData) {
    if (!lessonId) {
      throw new Error('[ChapterService] lessonId requis pour créer un chapitre')
    }
    try {
      const response = await api.post(endpoints.chapters.ofLesson(lessonId), chapterData)
      return response.data
    } catch (error) {
      console.error('[ChapterService] Erreur createChapter:', error)
      throw error
    }
  },

  /**
   * Mettre à jour un chapitre (Enseignant uniquement)
   * @param {Number} chapterId
   * @param {Object} chapterData
   * @returns {Promise}
   */
  async updateChapter(chapterId, chapterData) {
    try {
      const response = await api.put(endpoints.chapters.details(chapterId), chapterData)
      return response.data
    } catch (error) {
      console.error('[ChapterService] Erreur updateChapter:', error)
      throw error
    }
  },

  /**
   * Supprimer un chapitre (Enseignant uniquement)
   * @param {Number} chapterId
   * @returns {Promise}
   */
  async deleteChapter(chapterId) {
    try {
      const response = await api.delete(endpoints.chapters.details(chapterId))
      return response.data
    } catch (error) {
      console.error('[ChapterService] Erreur deleteChapter:', error)
      throw error
    }
  },

  /**
   * Réorganiser l'ordre des chapitres d'une leçon
   * @param {Number} lessonId - Leçon parente (segment d'URL, obligatoire)
   * @param {Array} chapters - Tableau d'objets {id, order}
   * @returns {Promise}
   */
  async reorderChapters(lessonId, chapters) {
    if (!lessonId) {
      throw new Error('[ChapterService] lessonId requis pour réordonner les chapitres')
    }
    try {
      const response = await api.post(endpoints.chapters.reorder(lessonId), { chapters })
      return response.data
    } catch (error) {
      console.error('[ChapterService] Erreur reorderChapters:', error)
      throw error
    }
  },

  /**
   * Obtenir le badge de statut
   * @param {Number} lessonsCount - Nombre de leçons
   * @returns {Object} - { class, text }
   */
  getStatusBadge(lessonsCount) {
    if (lessonsCount === 0) {
      return { class: 'bg-gray-200 text-gray-700', text: 'Vide' }
    } else if (lessonsCount < 3) {
      return { class: 'bg-blue-100 text-blue-700', text: `${lessonsCount} leçon${lessonsCount > 1 ? 's' : ''}` }
    } else {
      return { class: 'bg-green-100 text-green-700', text: `${lessonsCount} leçons` }
    }
  },

  /**
   * Formater la durée totale
   * @param {Number} minutes
   * @returns {String}
   */
  formatDuration(minutes) {
    return fmtDuration(minutes, { fallback: 'Non définie' })
  }
}

export default chapterService
