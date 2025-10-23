import api from './api'

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
      const queryParams = new URLSearchParams()

      if (params.matiere_id) queryParams.append('matiere_id', params.matiere_id)
      if (params.classe_id) queryParams.append('classe_id', params.classe_id)
      if (params.enseignant_id) queryParams.append('enseignant_id', params.enseignant_id)
      if (params.type) queryParams.append('type', params.type)
      if (params.status) queryParams.append('status', params.status)
      if (params.per_page) queryParams.append('per_page', params.per_page)

      const queryString = queryParams.toString()
      const url = queryString ? `/lessons?${queryString}` : '/lessons'

      const response = await api.get(url)
      return response.data
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
      const response = await api.get(`/lessons/${lessonId}`)
      return response.data
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
      const response = await api.post('/lessons', lessonData)
      return response.data
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
      const response = await api.put(`/lessons/${lessonId}`, lessonData)
      return response.data
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
      const response = await api.delete(`/lessons/${lessonId}`)
      return response.data
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
      const response = await api.post(`/lessons/${lessonId}/publish`)
      return response.data
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
      const response = await api.post(`/lessons/${lessonId}/unpublish`)
      return response.data
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
      const response = await api.get(`/lessons/${lessonId}/progress`)
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
      const response = await api.post(`/lessons/${lessonId}/progress`, {
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
      const response = await api.post(`/lessons/${lessonId}/complete`)
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
      const response = await api.post(`/lessons/${lessonId}/rating`, {
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
      cours: { class: 'bg-blue-100 text-blue-700', text: 'Cours', icon: '📖' },
      tp: { class: 'bg-purple-100 text-purple-700', text: 'TP', icon: '💻' },
      td: { class: 'bg-indigo-100 text-indigo-700', text: 'TD', icon: '✏️' },
      projet: { class: 'bg-pink-100 text-pink-700', text: 'Projet', icon: '🚀' },
      autre: { class: 'bg-gray-100 text-gray-700', text: 'Autre', icon: '📄' }
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
    if (!minutes) return 'N/A'

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    }
    return `${mins}min`
  }
}

export default lessonService
