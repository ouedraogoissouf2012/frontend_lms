import api from './api'

/**
 * Service LMS — domaine VISIO (`/lms/seances/{id}/{toggle,activate,...}-visio`, join/leave/heartbeat).
 * Cycle de vie de la visioconférence d'une séance.
 *
 * NOTE intercepteur : api.js retourne déjà response.data (ne pas refaire .data ici).
 */
export const lmsVisioService = {
  /**
   * Toggle visio pour une séance (coordinateurs uniquement)
   * @param {number} seanceId
   * @param {boolean} enabled
   * @param {string} visioType - 'jitsi'|'zoom'|'teams'|'bbb'
   * @returns {Promise<Object>}
   */
  async toggleVisio(seanceId, enabled, visioType = 'jitsi') {
    try {
      return await api.post(`/lms/seances/${seanceId}/toggle-visio`, {
        enabled,
        visio_type: visioType
      })
    } catch (error) {
      console.error('Erreur toggle visio:', error)
      throw error
    }
  },

  /**
   * Activer la visio pour une séance (enseignant)
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async activateVisio(seanceId) {
    try {
      return await api.post(`/lms/seances/${seanceId}/activate-visio`)
    } catch (error) {
      console.error('Erreur activation visio:', error)
      throw error
    }
  },

  /**
   * Désactiver la visio pour une séance (enseignant)
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async deactivateVisio(seanceId) {
    try {
      return await api.post(`/lms/seances/${seanceId}/deactivate-visio`)
    } catch (error) {
      console.error('Erreur désactivation visio:', error)
      throw error
    }
  },

  /**
   * Démarrer la visio (enseignant)
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async startVisio(seanceId) {
    try {
      return await api.post(`/lms/seances/${seanceId}/start-visio`)
    } catch (error) {
      console.error('Erreur démarrage visio:', error)
      throw error
    }
  },

  /**
   * Terminer la visio (enseignant)
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async endVisio(seanceId) {
    try {
      return await api.post(`/lms/seances/${seanceId}/end-visio`)
    } catch (error) {
      console.error('Erreur fin visio:', error)
      throw error
    }
  },

  /**
   * Rejoindre une visio (étudiant)
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async joinVisio(seanceId) {
    try {
      return await api.post(`/lms/seances/${seanceId}/join`)
    } catch (error) {
      console.error('Erreur rejoindre visio:', error)
      throw error
    }
  },

  /**
   * Enregistrer la sortie d'un participant de la visio
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async leaveVisio(seanceId) {
    try {
      return await api.post(`/lms/seances/${seanceId}/leave`)
    } catch (error) {
      console.error('Erreur leave visio:', error)
      throw error
    }
  },

  /**
   * Envoyer un heartbeat (ping d'activité) pour le participant
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async heartbeatVisio(seanceId) {
    try {
      return await api.post(`/lms/seances/${seanceId}/heartbeat`)
    } catch (error) {
      console.error('Erreur heartbeat visio:', error)
      throw error
    }
  },

  /**
   * Récupérer la liste des participants CONNECTÉS à une visio.
   * NE PAS confondre avec lmsSeancesService.getSeanceParticipants (participants AUTORISÉS).
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async getVisioParticipants(seanceId) {
    try {
      return await api.get(`/lms/seances/${seanceId}/visio-participants`)
    } catch (error) {
      console.error('Erreur récupération participants:', error)
      throw error
    }
  }
}

export default lmsVisioService
