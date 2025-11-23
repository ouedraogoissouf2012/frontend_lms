import api from './api'

/**
 * Service pour les endpoints LMS enrichis (KLASSCI + données locales LMS)
 * Ces endpoints combinent les données KLASSCI avec les données du LMS local
 *
 * IMPORTANT: L'intercepteur dans api.js (ligne 31) retourne déjà response.data
 * Donc on ne doit PAS faire .data une deuxième fois ici
 */
export const lmsService = {
  /**
   * Récupérer détails complets d'une classe (KLASSCI + données LMS)
   * @param {number} classeId
   * @returns {Promise<Object>}
   */
  async getClasseDetails(classeId) {
    try {
      // api.get retourne déjà response.data grâce à l'intercepteur
      return await api.get(`/lms/classes/${classeId}`)
    } catch (error) {
      console.error('Erreur récupération classe enrichie:', error)
      throw error
    }
  },

  /**
   * Récupérer les étudiants d'une classe
   * @param {number} classeId
   * @returns {Promise<Object>} { success, data: { etudiants } }
   */
  async getClasseEtudiants(classeId) {
    try {
      return await api.get(`/lms/classes/${classeId}/etudiants`)
    } catch (error) {
      console.error('Erreur récupération étudiants classe:', error)
      throw error
    }
  },

  /**
   * Récupérer détails complets d'une matière (KLASSCI + Lessons LMS + Séances + Évaluations)
   * @param {number} matiereId
   * @returns {Promise<Object>} { success, data: { matiere, lessons, seances_programmees, evaluations_programmees, statistiques } }
   */
  async getMatiereDetails(matiereId) {
    try {
      // api.get retourne déjà response.data grâce à l'intercepteur
      return await api.get(`/lms/matieres/${matiereId}`)
    } catch (error) {
      console.error('Erreur récupération matière enrichie:', error)
      throw error
    }
  },

  /**
   * Récupérer toutes les classes (via proxy KLASSCI)
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getClasses() {
    try {
      return await api.get('/proxy/classes')
    } catch (error) {
      console.error('Erreur récupération classes:', error)
      throw error
    }
  },

  /**
   * Récupérer tous les enseignants (via LMS + KLASSCI)
   * @param {boolean} withDetails - Inclure détails complets (classes, matières, stats)
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getEnseignants(withDetails = false) {
    try {
      const url = withDetails ? '/lms/enseignants?with_details=true' : '/lms/enseignants'
      return await api.get(url)
    } catch (error) {
      console.error('Erreur récupération enseignants:', error)
      throw error
    }
  },

  /**
   * Récupérer séances à venir avec filtres
   * @param {Object} params - { days, teacher_id, classe_id }
   * @returns {Promise<Array>}
   */
  async getUpcomingSeances(params = {}) {
    try {
      return await api.get('/lms/seances/upcoming', { params })
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
      return await api.get(`/lms/seances/${seanceId}/details`)
    } catch (error) {
      console.error('Erreur récupération détails séance:', error)
      throw error
    }
  },

  /**
   * Récupérer participants autorisés d'une séance
   * @param {number} seanceId
   * @returns {Promise<Object>} { teacher, students, total }
   */
  async getSeanceParticipants(seanceId) {
    try {
      return await api.get(`/lms/seances/${seanceId}/participants`)
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
      return await api.post(`/lms/seances/${seanceId}/validate-participant`, {
        user_id: userId
      })
    } catch (error) {
      console.error('Erreur validation participant:', error)
      throw error
    }
  },

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
   * Synchroniser attendances depuis session vidéo
   * @param {number} seanceId
   * @param {string} date - 'YYYY-MM-DD'
   * @param {Array} participants - [{ user_id, joined_at, left_at, duration_minutes }]
   * @returns {Promise<Object>}
   */
  async syncVideoAttendances(seanceId, date, participants) {
    try {
      return await api.post('/lms/attendances/from-video-session', {
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
   * Récupérer préférences de notification d'un utilisateur
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getNotificationPreferences(userId) {
    try {
      return await api.get(`/lms/notifications/preferences/${userId}`)
    } catch (error) {
      console.error('Erreur récupération préférences notifications:', error)
      throw error
    }
  },

  /**
   * Envoyer rappel de séance
   * @param {Object} data - { seance_id, user_ids, reminder_time }
   * @returns {Promise<Object>}
   */
  async sendSessionReminder(data) {
    try {
      return await api.post('/lms/notifications/send-session-reminder', data)
    } catch (error) {
      console.error('Erreur envoi rappel séance:', error)
      throw error
    }
  },

  /**
   * Récupérer les séances de l'enseignant connecté
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getMyTeachingSeances() {
    try {
      return await api.get('/lms/seances/my-teaching')
    } catch (error) {
      console.error('Erreur récupération mes séances enseignant:', error)
      throw error
    }
  },

  /**
   * Récupérer les séances/cours de l'étudiant connecté
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getMyClassesSeances() {
    try {
      return await api.get('/lms/seances/my-classes')
    } catch (error) {
      console.error('Erreur récupération mes cours étudiant:', error)
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
   * Récupérer la liste des participants à une visio (OPTION B)
   * @param {number} seanceId
   * @returns {Promise<Object>}
   */
  async getVisioParticipants(seanceId) {
    try {
      return await api.get(`/lms/seances/${seanceId}/participants`)
    } catch (error) {
      console.error('Erreur récupération participants:', error)
      throw error
    }
  },

  /**
   * Récupérer le dashboard enseignant (matières, classes, stats)
   * @returns {Promise<Object>} { success, data: { matieres, classes, stats } }
   */
  async getTeacherDashboard() {
    try {
      return await api.get('/proxy/me/teacher-dashboard')
    } catch (error) {
      console.error('Erreur récupération dashboard enseignant:', error)
      throw error
    }
  },

  /**
   * Récupérer les matières de l'enseignant avec statistiques enrichies
   * @returns {Promise<Object>} { success, data: [...] }
   */
  async getMyMatieres() {
    try {
      return await api.get('/lms/teacher/my-matieres')
    } catch (error) {
      console.error('Erreur récupération mes matières:', error)
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
      return await api.post(`/lms/seances/${seanceId}/hide`)
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
      return await api.post(`/lms/seances/${seanceId}/unhide`)
    } catch (error) {
      console.error('Erreur réaffichage séance:', error)
      throw error
    }
  }
,

  /**
   * Récupérer l'historique des présences (accessible même si séances archivées)
   * @param {Object} params - Paramètres de filtrage { page, per_page, date_from, date_to, seance_id }
   * @returns {Promise<Object>} { success, data: [...], pagination: {...} }
   */
  async getAttendanceHistory(params = {}) {
    try {
      return await api.get('/lms/attendance/history', { params })
    } catch (error) {
      console.error('Erreur récupération historique présences:', error)
      throw error
    }
  }

}

export default lmsService
