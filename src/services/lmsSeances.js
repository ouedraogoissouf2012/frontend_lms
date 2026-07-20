import api from './api'
import { endpoints } from './endpoints'

const UPCOMING_SEANCES_TIMEOUT_MS = 5000

/**
 * Service LMS — domaine SÉANCES & PRÉSENCES (`/lms/seances/*`, `/lms/attendance*`).
 * Couvre le cycle de vie des séances (hors visio, cf. lmsVisioService) :
 * consultation, participants autorisés, présences, historique, suppression.
 *
 * NOTE intercepteur : api.js retourne déjà response.data (ne pas refaire .data ici).
 */
export const lmsSeancesService = {
  /**
   * Récupérer séances à venir avec filtres
   * @param {Object} params - { days, teacher_id, classe_id }
   * @returns {Promise<Array>}
   */
  async getUpcomingSeances(params = {}) {
    try {
      return await api.get(endpoints.lms.seances.upcoming, {
        params,
        timeout: UPCOMING_SEANCES_TIMEOUT_MS
      })
    } catch (error) {
      console.error('Erreur récupération séances à venir:', error)
      throw error
    }
  },

  /**
   * Récupérer détails complets d'une séance (avec infos visio et fenêtre temporelle)
   * @param {number} seanceId
   * @returns {Promise<Object>} { seance, visio, participants }
   */
  async getSeanceDetails(seanceId) {
    try {
      return await api.get(endpoints.lms.seances.details(seanceId))
    } catch (error) {
      console.error('Erreur récupération détails séance:', error)
      throw error
    }
  },

  /**
   * Récupérer participants AUTORISÉS d'une séance.
   * NE PAS confondre avec lmsVisioService.getVisioParticipants (participants CONNECTÉS).
   * @param {number} seanceId
   * @returns {Promise<Object>} { teacher, students, total }
   */
  async getSeanceParticipants(seanceId) {
    try {
      return await api.get(endpoints.lms.seances.participants(seanceId))
    } catch (error) {
      console.error('Erreur récupération participants séance:', error)
      throw error
    }
  },

  /**
   * Valider l'accès d'un participant à une séance
   * @param {number} seanceId
   * @param {number} userId
   * @returns {Promise<Object>} { authorized, reason, user_role, seance }
   */
  async validateParticipant(seanceId, userId) {
    try {
      return await api.post(endpoints.lms.seances.validateParticipant(seanceId), {
        user_id: userId
      })
    } catch (error) {
      console.error('Erreur validation participant:', error)
      throw error
    }
  },

  /**
   * Synchroniser attendances depuis session vidéo
   * @param {number} seanceId
   * @param {string} date - 'YYYY-MM-DD'
   * @param {Array} participants - [{ user_id, joined_at, left_at, duration_minutes }]
   * @returns {Promise<Object>}
   */
  async syncVideoAttendances(seanceId, date, participants) {
    try {
      return await api.post(endpoints.lms.attendance.fromVideoSession, {
        seance_cours_id: seanceId,
        date,
        participants
      })
    } catch (error) {
      console.error('Erreur sync attendances vidéo:', error)
      throw error
    }
  },

  /**
   * Récupérer les séances de l'enseignant connecté
   * @param {boolean} forceRefresh - Si true, bypass le cache KLASSCI
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getMyTeachingSeances(forceRefresh = false) {
    const params = forceRefresh ? { refresh: true } : {}
    return await api.get(endpoints.lms.seances.myTeaching, { params })
  },

  /**
   * Récupérer les séances/cours de l'étudiant connecté
   * @param {boolean} forceRefresh - Si true, bypass le cache KLASSCI
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getMyClassesSeances(forceRefresh = false) {
    try {
      const params = forceRefresh ? { refresh: true } : {}
      return await api.get(endpoints.lms.seances.myClasses, { params })
    } catch (error) {
      console.error('Erreur récupération mes cours étudiant:', error)
      throw error
    }
  },

  /**
   * Masquer une séance (étudiant uniquement)
   * @param {number} seanceId
   * @returns {Promise<Object>} { success, message }
   */
  async hideSeance(seanceId) {
    try {
      return await api.post(endpoints.lms.seances.hide(seanceId))
    } catch (error) {
      console.error('Erreur masquage séance:', error)
      throw error
    }
  },

  /**
   * Réafficher une séance (étudiant uniquement)
   * @param {number} seanceId
   * @returns {Promise<Object>} { success, message }
   */
  async unhideSeance(seanceId) {
    try {
      return await api.post(endpoints.lms.seances.unhide(seanceId))
    } catch (error) {
      console.error('Erreur réaffichage séance:', error)
      throw error
    }
  },

  /**
   * Récupérer l'historique des présences (accessible même si séances archivées)
   * @param {Object} params - { page, per_page, date_from, date_to, seance_id }
   * @returns {Promise<Object>} { success, data: [...], pagination: {...} }
   */
  async getAttendanceHistory(params = {}) {
    try {
      return await api.get(endpoints.lms.attendance.history, { params })
    } catch (error) {
      console.error('Erreur récupération historique présences:', error)
      throw error
    }
  },

  /**
   * Récupère l'historique des séances avec statistiques de présences
   * @param {Object} params - { page, per_page, date_from, date_to, search }
   * @returns {Promise<Object>} { success, data: [...], pagination: {...} }
   */
  async getSeancesHistory(params = {}) {
    try {
      return await api.get(endpoints.lms.seances.history, { params })
    } catch (error) {
      console.error('Erreur récupération historique séances:', error)
      throw error
    }
  },

  /**
   * Récupère les détails des présences pour une séance spécifique
   * @param {Number} seanceId - ID de la séance
   * @returns {Promise<Object>} { success, seance: {...}, statistics: {...}, attendances: [...] }
   */
  async getSeanceAttendances(seanceId) {
    try {
      return await api.get(endpoints.lms.seances.attendances(seanceId))
    } catch (error) {
      console.error('Erreur récupération présences séance:', error)
      throw error
    }
  },

  /**
   * Supprime une séance
   * @param {Number} seanceId - ID de la séance
   * @returns {Promise<Object>}
   */
  async deleteSeance(seanceId) {
    try {
      return await api.delete(endpoints.lms.seances.delete(seanceId))
    } catch (error) {
      console.error('Erreur suppression séance:', error)
      throw error
    }
  }
}

export default lmsSeancesService
