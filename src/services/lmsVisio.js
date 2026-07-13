import api from './api'
import { endpoints } from './endpoints'

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
      return await api.post(endpoints.lms.visio.toggle(seanceId), {
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
      return await api.post(endpoints.lms.visio.activate(seanceId))
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
      return await api.post(endpoints.lms.visio.deactivate(seanceId))
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
      return await api.post(endpoints.lms.visio.start(seanceId))
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
      return await api.post(endpoints.lms.visio.end(seanceId))
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
      return await api.post(endpoints.lms.visio.join(seanceId))
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
      return await api.post(endpoints.lms.visio.leave(seanceId))
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
      return await api.post(endpoints.lms.visio.heartbeat(seanceId))
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
      return await api.get(endpoints.lms.visio.participants(seanceId))
    } catch (error) {
      console.error('Erreur récupération participants:', error)
      throw error
    }
  },

  /**
   * Récupérer le statut d'enregistrement d'une séance visio.
   * @param {number|string} seanceId
   * @returns {Promise<Object>}
   */
  async getVisioRecording(seanceId) {
    try {
      return await api.get(endpoints.lms.visio.recordingStatus(seanceId))
    } catch (error) {
      console.error('Erreur récupération statut enregistrement:', error)
      throw error
    }
  },

  /**
   * Démarrer l'enregistrement d'une séance visio (enseignant autorisé).
   * @param {number|string} seanceId
   * @returns {Promise<Object>}
   */
  async startVisioRecording(seanceId) {
    try {
      return await api.post(endpoints.lms.visio.recordingStart(seanceId))
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error)
      throw error
    }
  },

  /**
   * Arrêter l'enregistrement d'une séance visio (enseignant autorisé).
   * @param {number|string} seanceId
   * @returns {Promise<Object>}
   */
  async stopVisioRecording(seanceId) {
    try {
      return await api.post(endpoints.lms.visio.recordingStop(seanceId))
    } catch (error) {
      console.error('Erreur arrêt enregistrement:', error)
      throw error
    }
  }
}

export default lmsVisioService
