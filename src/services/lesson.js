import api from './api'
import { formatDuration as fmtDuration } from '../utils/formatters'
import { endpoints } from './endpoints'

/**
 * Service pour la gestion des leçons (Lessons)
 */
const lessonService = {
  /**
   * Récupérer la liste des leçons avec filtres
   * @param {Object} params - Filtres (matiere_id, classe_id, type, status, per_page)
   * @returns {Promise}
   */
  async getLessons(params = {}) {
    try {
      const response = await api.get(endpoints.lessons.list, { params })
      // L'intercepteur API retourne déjà response.data, donc response contient { success, message, data }
      return response
    } catch (error) {
      console.error('[LessonService] Erreur getLessons:', error)
      throw error
    }
  },

  /**
   * Récupérer les détails d'une leçon
   * @param {Number} lessonId
   * @returns {Promise}
   */
  async getLesson(lessonId) {
    try {
      const response = await api.get(endpoints.lessons.details(lessonId))
      // L'intercepteur API retourne déjà response.data, donc response contient { success, message, data }
      return response
    } catch (error) {
      console.error('[LessonService] Erreur getLesson:', error)
      throw error
    }
  },

  /**
   * Créer une nouvelle leçon (Enseignant uniquement)
   * @param {Object} lessonData
   * @returns {Promise}
   */
  async createLesson(lessonData) {
    try {
      const response = await api.post(endpoints.lessons.list, lessonData)
      // L'intercepteur API retourne déjà response.data, donc response contient { success, message, data }
      return response
    } catch (error) {
      console.error('[LessonService] Erreur createLesson:', error)
      throw error
    }
  },

  /**
   * Mettre à jour une leçon (Enseignant uniquement)
   * @param {Number} lessonId
   * @param {Object} lessonData
   * @returns {Promise}
   */
  async updateLesson(lessonId, lessonData) {
    try {
      const response = await api.put(endpoints.lessons.details(lessonId), lessonData)
      // L'intercepteur API retourne déjà response.data, donc response contient { success, message, data }
      return response
    } catch (error) {
      console.error('[LessonService] Erreur updateLesson:', error)
      throw error
    }
  },

  /**
   * Supprimer une leçon (Enseignant uniquement)
   * @param {Number} lessonId
   * @returns {Promise}
   */
  async deleteLesson(lessonId) {
    try {
      const response = await api.delete(endpoints.lessons.details(lessonId))
      // L'intercepteur API retourne déjà response.data, donc response contient { success, message, data }
      return response
    } catch (error) {
      console.error('[LessonService] Erreur deleteLesson:', error)
      throw error
    }
  },

  /**
   * Publier une leçon (Enseignant uniquement)
   * @param {Number} lessonId
   * @returns {Promise}
   */
  async publishLesson(lessonId) {
    try {
      const response = await api.post(endpoints.lessons.publish(lessonId))
      // L'intercepteur API retourne déjà response.data, donc response contient { success, message, data }
      return response
    } catch (error) {
      console.error('[LessonService] Erreur publishLesson:', error)
      throw error
    }
  },

  /**
   * Dépublier une leçon (Enseignant uniquement)
   * @param {Number} lessonId
   * @returns {Promise}
   */
  async unpublishLesson(lessonId) {
    try {
      const response = await api.post(endpoints.lessons.unpublish(lessonId))
      // L'intercepteur API retourne déjà response.data, donc response contient { success, message, data }
      return response
    } catch (error) {
      console.error('[LessonService] Erreur unpublishLesson:', error)
      throw error
    }
  },

  /**
   * Récupérer la progression d'une leçon
   * @param {Number} lessonId
   * @returns {Promise}
   */
  async getProgress(lessonId) {
    try {
      const response = await api.get(endpoints.lessons.progress(lessonId))
      return response.data
    } catch (error) {
      console.error('[LessonService] Erreur getProgress:', error)
      throw error
    }
  },

  /**
   * Mettre à jour sa progression (Étudiant)
   * @param {Number} lessonId
   * @param {Number} progressPercentage - 0-100
   * @param {Number} timeSpentMinutes - Temps passé en minutes
   * @returns {Promise}
   */
  async updateProgress(lessonId, progressPercentage, timeSpentMinutes = 0) {
    try {
      const response = await api.post(endpoints.lessons.progress(lessonId), {
        progress_percentage: progressPercentage,
        time_spent_minutes: timeSpentMinutes
      })
      return response.data
    } catch (error) {
      console.error('[LessonService] Erreur updateProgress:', error)
      throw error
    }
  },

  /**
   * Marquer une leçon comme complétée (Étudiant)
   * @param {Number} lessonId
   * @returns {Promise}
   */
  async markComplete(lessonId) {
    try {
      const response = await api.post(endpoints.lessons.complete(lessonId))
      return response.data
    } catch (error) {
      console.error('[LessonService] Erreur markComplete:', error)
      throw error
    }
  },

  /**
   * Noter une leçon (Étudiant)
   * @param {Number} lessonId
   * @param {Number} rating - 1-5 étoiles
   * @param {String} feedback - Commentaire optionnel
   * @returns {Promise}
   */
  async rateLesson(lessonId, rating, feedback = null) {
    try {
      const response = await api.post(endpoints.lessons.rating(lessonId), {
        rating,
        feedback
      })
      return response.data
    } catch (error) {
      console.error('[LessonService] Erreur rateLesson:', error)
      throw error
    }
  },

  /**
   * Obtenir le badge de statut
   * @param {String} status - draft, published, archived
   * @returns {Object} - { class, text }
   */
  getStatusBadge(status) {
    const badges = {
      draft: { class: 'bg-gray-200 text-gray-700', text: 'Brouillon' },
      published: { class: 'bg-green-100 text-green-700', text: 'Publié' },
      archived: { class: 'bg-orange-100 text-orange-700', text: 'Archivé' }
    }
    return badges[status] || badges.draft
  },

  /**
   * Obtenir le badge de type
   * @param {String} type - cours, tp, td, projet, autre
   * @returns {Object} - { class, text, icon }
   */
  getTypeBadge(type) {
    const badges = {
      cours: { class: 'bg-blue-100 text-blue-700', text: 'Cours', icon: 'fa-book' },
      tp: { class: 'bg-purple-100 text-purple-700', text: 'TP', icon: 'fa-laptop' },
      td: { class: 'bg-indigo-100 text-indigo-700', text: 'TD', icon: 'fa-pencil' },
      projet: { class: 'bg-pink-100 text-pink-700', text: 'Projet', icon: 'fa-rocket' },
      autre: { class: 'bg-gray-100 text-gray-700', text: 'Autre', icon: 'fa-file-text-o' }
    }
    return badges[type] || badges.cours
  },

  /**
   * Obtenir le badge de progression
   * @param {Number} percentage - 0-100
   * @returns {Object} - { class, text, color }
   */
  getProgressBadge(percentage) {
    if (percentage === 0) {
      return { class: 'bg-gray-200 text-gray-600', text: 'Non commencé', color: 'gray' }
    } else if (percentage < 30) {
      return { class: 'bg-red-100 text-red-700', text: 'Débuté', color: 'red' }
    } else if (percentage < 70) {
      return { class: 'bg-yellow-100 text-yellow-700', text: 'En cours', color: 'yellow' }
    } else if (percentage < 100) {
      return { class: 'bg-blue-100 text-blue-700', text: 'Presque terminé', color: 'blue' }
    } else {
      return { class: 'bg-green-100 text-green-700', text: 'Terminé', color: 'green' }
    }
  },

  /**
   * Formater la durée
   * @param {Number} minutes
   * @returns {String}
   */
  formatDuration(minutes) {
    return fmtDuration(minutes, { fallback: 'N/A' })
  },

  /**
   * Obtenir le badge de type de contenu
   * @param {String} contentType - text, video, pdf, audio, presentation, link, mixed
   * @returns {Object} - { class, text, icon }
   */
  getContentTypeBadge(contentType) {
    const badges = {
      text: { class: 'bg-gray-100 text-gray-700', text: 'Texte', icon: '📝' },
      video: { class: 'bg-red-100 text-red-700', text: 'Vidéo', icon: '🎥' },
      pdf: { class: 'bg-orange-100 text-orange-700', text: 'PDF', icon: '📄' },
      audio: { class: 'bg-purple-100 text-purple-700', text: 'Audio', icon: '🎵' },
      presentation: { class: 'bg-yellow-100 text-yellow-700', text: 'Présentation', icon: '📊' },
      link: { class: 'bg-blue-100 text-blue-700', text: 'Lien', icon: '🔗' },
      mixed: { class: 'bg-indigo-100 text-indigo-700', text: 'Mixte', icon: '📚' }
    }
    return badges[contentType] || badges.text
  },

  /**
   * Obtenir les options de provider vidéo
   * @returns {Array}
   */
  getVideoProviders() {
    return [
      { value: 'youtube', label: 'YouTube', icon: '▶️' },
      { value: 'vimeo', label: 'Vimeo', icon: '🎬' },
      { value: 'local', label: 'Fichier local', icon: '💾' },
      { value: 'other', label: 'Autre', icon: '🌐' }
    ]
  }
}

export default lessonService
