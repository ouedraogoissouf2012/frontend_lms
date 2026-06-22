import api from './api'
import { VISIO_CONFIG } from '../constants/visio'
import { VISIO_PARTICIPATION_PREFIX, visioParticipationKey } from '../constants/storageKeys'
import * as jitsiRoom from '../utils/jitsiRoom'

/**
 * Service pour la gestion des visioconférences Jitsi Meet
 *
 * Fonctionnalités:
 * - Génération de liens Jitsi avec room ID unique
 * - Tracking des participants (join/leave times)
 * - Calcul des durées de présence
 * - Synchronisation des présences vers KLASSCI
 */

// Domaine Jitsi : centralisé dans src/constants/visio.js (configurable VITE_JITSI_DOMAIN, #24)
// Alternative: Déployer votre propre serveur Jitsi et utiliser votre domaine

export const jitsiService = {
  // --- Construction de salle / lien (logique pure déléguée à utils/jitsiRoom.js, G8) ---
  // API publique inchangée : mêmes signatures et comportement qu'à l'origine.

  /**
   * Générer un lien Jitsi unique pour une séance
   * @param {Object} seance - { id, visio_room_id, matiere, classe }
   * @returns {string} URL Jitsi
   */
  generateRoomLink(seance) {
    return jitsiRoom.generateRoomLink(seance)
  },

  /**
   * Générer un Room ID unique pour la séance (format: lms_seance_{id}_{timestamp})
   * @param {Object} seance
   * @returns {string}
   */
  generateRoomId(seance) {
    return jitsiRoom.generateRoomId(seance)
  },

  /**
   * Construire le nom de la salle Jitsi (format: LMS-{Matiere}-{Classe}-{Date})
   * @param {Object} seance
   * @param {string} roomId
   * @returns {string}
   */
  buildRoomName(seance, roomId) {
    return jitsiRoom.buildRoomName(seance, roomId)
  },

  /**
   * Sanitize string pour URL (supprime espaces, accents, caractères spéciaux)
   * @param {string} str
   * @returns {string}
   */
  sanitizeForUrl(str) {
    return jitsiRoom.sanitizeForUrl(str)
  },

  /**
   * Enregistrer qu'un participant a rejoint la visio (heure de début en localStorage).
   * @param {number} seanceId @param {number} userId @returns {Promise<Object>}
   */
  async trackParticipantJoin(seanceId, userId) {
    const joinTime = new Date().toISOString()

    // Stocker localement pour tracking
    const participationKey = visioParticipationKey(seanceId, userId)
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
   * Enregistrer qu'un participant a quitté la visio : calcule la durée et synchronise (KLASSCI).
   * @param {number} seanceId @param {number} userId @returns {Promise<Object>}
   */
  async trackParticipantLeave(seanceId, userId) {
    const leaveTime = new Date().toISOString()

    // Récupérer la participation du localStorage
    const participationKey = visioParticipationKey(seanceId, userId)
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
   * Synchroniser une participation vers KLASSCI (présences via l'endpoint LMS).
   * @param {number} seanceId @param {Object} participation @returns {Promise<Object>}
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
   * Synchroniser toutes les participations en attente (retry des syncs échouées).
   * @returns {Promise<Array>}
   */
  async syncPendingParticipations() {
    const results = []

    // Parcourir le localStorage pour trouver les participations non synchronisées
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key && key.startsWith(VISIO_PARTICIPATION_PREFIX)) {
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

      if (key && key.startsWith(VISIO_PARTICIPATION_PREFIX)) {
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
    const expirationMs = VISIO_CONFIG.PARTICIPATION_EXPIRATION_MS
    const now = Date.now()

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)

      if (key && key.startsWith(VISIO_PARTICIPATION_PREFIX)) {
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
   * Vérifier si une séance a une visio active (UI: badge "En cours").
   * @param {number} seanceId @returns {Promise<boolean>}
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
