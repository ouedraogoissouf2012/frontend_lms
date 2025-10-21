import api from './api'
import { auth } from './api'

/**
 * Service pour la gestion des visioconférences Jitsi Meet
 *
 * Fonctionnalités:
 * - Génération de liens Jitsi avec room ID unique
 * - Tracking des participants (join/leave times)
 * - Calcul des durées de présence
 * - Synchronisation des présences vers KLASSCI
 */

// Configuration Jitsi
const JITSI_DOMAIN = 'meet.jit.si' // Utilise le serveur public Jitsi
// Alternative: Déployer votre propre serveur Jitsi et utiliser votre domaine

export const jitsiService = {
  /**
   * Générer un lien Jitsi unique pour une séance
   * @param {Object} seance - { id, visio_room_id, matiere, classe }
   * @returns {string} URL Jitsi
   */
  generateRoomLink(seance) {
    // Utiliser visio_room_id si existant, sinon générer un ID unique
    const roomId = seance.visio_room_id || this.generateRoomId(seance)

    // Construire le nom de la salle
    const roomName = this.buildRoomName(seance, roomId)

    // URL Jitsi avec paramètres
    const user = auth.getUser()
    const displayName = encodeURIComponent(user?.name || 'Participant')

    // Configuration Jitsi via URL params
    const params = new URLSearchParams({
      'userInfo.displayName': user?.name || 'Participant',
      'config.prejoinPageEnabled': 'false', // Skip prejoin page
      'config.startWithAudioMuted': user?.role === 'etudiant', // Mute students by default
      'config.startWithVideoMuted': false,
      'interfaceConfig.SHOW_JITSI_WATERMARK': 'false',
      'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS': 'false',
      'interfaceConfig.DEFAULT_LOGO_URL': '',
      'interfaceConfig.DEFAULT_WELCOME_PAGE_LOGO_URL': ''
    })

    const jitsiUrl = `https://${JITSI_DOMAIN}/${roomName}#${params.toString()}`

    console.log('[JitsiService] Lien généré:', jitsiUrl)
    console.log('[JitsiService] Room ID:', roomId)
    console.log('[JitsiService] User:', user?.name, user?.role)

    return jitsiUrl
  },

  /**
   * Générer un Room ID unique pour la séance
   * Format: lms_seance_{id}_{timestamp}
   * @param {Object} seance
   * @returns {string}
   */
  generateRoomId(seance) {
    const timestamp = Date.now()
    return `lms_seance_${seance.id}_${timestamp}`
  },

  /**
   * Construire le nom de la salle Jitsi
   * Format: LMS-{Matiere}-{Classe}-{Date}
   * Ex: LMS-Mathematiques-L1-InfoA-2025-10-20
   * @param {Object} seance
   * @param {string} roomId
   * @returns {string}
   */
  buildRoomName(seance, roomId) {
    const parts = ['LMS']

    // Ajouter matière (sanitized)
    if (seance.matiere?.nom) {
      parts.push(this.sanitizeForUrl(seance.matiere.nom))
    }

    // Ajouter classe (sanitized)
    if (seance.classe?.nom) {
      parts.push(this.sanitizeForUrl(seance.classe.nom))
    }

    // Ajouter date
    if (seance.programmation?.date) {
      const date = new Date(seance.programmation.date)
      const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
      parts.push(dateStr)
    }

    // Ajouter Room ID court (derniers 8 caractères)
    parts.push(roomId.slice(-8))

    return parts.join('-')
  },

  /**
   * Sanitize string pour URL
   * Supprime espaces, accents, caractères spéciaux
   * @param {string} str
   * @returns {string}
   */
  sanitizeForUrl(str) {
    return str
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-zA-Z0-9]/g, '') // Garde seulement alphanumérique
      .substring(0, 20) // Limite à 20 caractères
  },

  /**
   * Enregistrer qu'un participant a rejoint la visio
   * Enregistre l'heure de début dans localStorage (tracking côté client)
   * @param {number} seanceId
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async trackParticipantJoin(seanceId, userId) {
    const joinTime = new Date().toISOString()

    // Stocker localement pour tracking
    const participationKey = `visio_participation_${seanceId}_${userId}`
    const participation = {
      seance_id: seanceId,
      user_id: userId,
      joined_at: joinTime,
      left_at: null,
      duration_minutes: 0
    }

    localStorage.setItem(participationKey, JSON.stringify(participation))

    console.log('[JitsiService] Participant rejoint:', {
      seanceId,
      userId,
      joinTime
    })

    // Optionnel: Envoyer événement au backend en temps réel
    try {
      await api.post('/lms/visio/track-join', {
        seance_id: seanceId,
        user_id: userId,
        joined_at: joinTime
      })
    } catch (error) {
      console.warn('[JitsiService] Erreur envoi track-join (non bloquant):', error)
    }

    return participation
  },

  /**
   * Enregistrer qu'un participant a quitté la visio
   * Calcule la durée et synchronise avec KLASSCI
   * @param {number} seanceId
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async trackParticipantLeave(seanceId, userId) {
    const leaveTime = new Date().toISOString()

    // Récupérer la participation du localStorage
    const participationKey = `visio_participation_${seanceId}_${userId}`
    const storedData = localStorage.getItem(participationKey)

    if (!storedData) {
      console.warn('[JitsiService] Aucune participation trouvée pour:', seanceId, userId)
      return null
    }

    const participation = JSON.parse(storedData)
    participation.left_at = leaveTime

    // Calculer la durée en minutes
    const joinTime = new Date(participation.joined_at)
    const leftTime = new Date(leaveTime)
    const durationMs = leftTime - joinTime
    participation.duration_minutes = Math.round(durationMs / 60000) // Convertir ms en minutes

    // Mettre à jour le localStorage
    localStorage.setItem(participationKey, JSON.stringify(participation))

    console.log('[JitsiService] Participant quitté:', {
      seanceId,
      userId,
      leaveTime,
      duration: participation.duration_minutes
    })

    // Synchroniser avec le backend (et KLASSCI)
    try {
      const response = await this.syncParticipation(seanceId, participation)

      // Nettoyer le localStorage après sync réussi
      if (response.success) {
        localStorage.removeItem(participationKey)
      }

      return response
    } catch (error) {
      console.error('[JitsiService] Erreur sync participation:', error)
      // Garder dans localStorage pour retry ultérieur
      return { success: false, error }
    }
  },

  /**
   * Synchroniser une participation vers KLASSCI
   * Envoie les données de présence via l'endpoint LMS
   * @param {number} seanceId
   * @param {Object} participation
   * @returns {Promise<Object>}
   */
  async syncParticipation(seanceId, participation) {
    try {
      // Récupérer la date de la séance
      const seanceResponse = await api.get(`/lms/seances/${seanceId}/details`)
      const seance = seanceResponse?.data?.seance

      if (!seance || !seance.programmation?.date) {
        throw new Error('Date de séance introuvable')
      }

      // Préparer les données pour l'API
      const syncData = {
        seance_cours_id: seanceId,
        date: seance.programmation.date, // Format YYYY-MM-DD
        participants: [
          {
            user_id: participation.user_id,
            joined_at: participation.joined_at,
            left_at: participation.left_at,
            duration_minutes: participation.duration_minutes
          }
        ]
      }

      console.log('[JitsiService] Synchronisation participation:', syncData)

      // Appeler l'endpoint de synchronisation
      const response = await api.post('/lms/attendances/from-video-session', syncData)

      console.log('[JitsiService] Sync réussie:', response)

      return response
    } catch (error) {
      console.error('[JitsiService] Erreur sync participation:', error)
      throw error
    }
  },

  /**
   * Synchroniser toutes les participations en attente
   * Utile pour retry des syncs échouées
   * @returns {Promise<Array>}
   */
  async syncPendingParticipations() {
    const results = []

    // Parcourir le localStorage pour trouver les participations non synchronisées
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && key.startsWith('visio_participation_')) {
        const data = localStorage.getItem(key)
        const participation = JSON.parse(data)

        // Si la participation a un left_at, on peut la synchroniser
        if (participation.left_at) {
          try {
            const result = await this.syncParticipation(
              participation.seance_id,
              participation
            )

            if (result.success) {
              localStorage.removeItem(key)
              results.push({ key, success: true })
            } else {
              results.push({ key, success: false, error: result.error })
            }
          } catch (error) {
            results.push({ key, success: false, error })
          }
        }
      }
    }

    console.log('[JitsiService] Sync pending results:', results)
    return results
  },

  /**
   * Obtenir les participations en attente de synchronisation
   * @returns {Array}
   */
  getPendingParticipations() {
    const pending = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && key.startsWith('visio_participation_')) {
        const data = localStorage.getItem(key)
        const participation = JSON.parse(data)

        if (participation.left_at) {
          pending.push({ key, ...participation })
        }
      }
    }

    return pending
  },

  /**
   * Nettoyer les participations expirées (> 7 jours)
   */
  cleanupExpiredParticipations() {
    const expirationMs = 7 * 24 * 60 * 60 * 1000 // 7 jours
    const now = Date.now()

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)

      if (key && key.startsWith('visio_participation_')) {
        const data = localStorage.getItem(key)
        const participation = JSON.parse(data)

        const joinTime = new Date(participation.joined_at).getTime()

        if (now - joinTime > expirationMs) {
          console.log('[JitsiService] Suppression participation expirée:', key)
          localStorage.removeItem(key)
        }
      }
    }
  },

  /**
   * Vérifier si une séance a une visio active
   * (Utile pour l'UI: afficher badge "En cours")
   * @param {number} seanceId
   * @returns {Promise<boolean>}
   */
  async isVisioActive(seanceId) {
    try {
      const response = await api.get(`/lms/seances/${seanceId}/visio-status`)
      return response?.data?.active || false
    } catch (error) {
      console.error('[JitsiService] Erreur vérification statut visio:', error)
      return false
    }
  }
}

// Nettoyer les participations expirées au chargement
jitsiService.cleanupExpiredParticipations()

export default jitsiService
