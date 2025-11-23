import { ref, onBeforeUnmount } from 'vue'
import lmsService from '@/services/lms'

/**
 * Composable pour gérer la participation à une visioconférence
 *
 * Améliorations v2 (avec Web Worker) :
 * - Heartbeat continue même si l'onglet est inactif (Web Worker)
 * - Page Visibility API pour heartbeat immédiat au retour
 * - Beacon API pour garantir l'envoi de leaveVisio
 * - beforeunload handler pour déconnexion propre
 *
 * @param {number} seanceId - ID de la séance
 * @returns {Object} Méthodes et états pour gérer la participation
 */
export function useVisioParticipation(seanceId) {
  // États réactifs
  const isInVisio = ref(false)
  const visioWindow = ref(null)
  const heartbeatWorker = ref(null)

  /**
   * Démarrer le Web Worker pour le heartbeat
   * Le Worker tourne en arrière-plan, indépendant de l'état de l'onglet
   */
  const startHeartbeat = () => {
    stopHeartbeat()

    try {
      // Créer le Worker
      heartbeatWorker.value = new Worker('/heartbeat-worker.js')

      // Écouter les messages du Worker
      heartbeatWorker.value.addEventListener('message', async (e) => {
        const { type, timestamp } = e.data

        if (type === 'heartbeat') {
          // Le Worker demande d'envoyer un heartbeat
          await sendHeartbeat()
        } else if (type === 'started') {
          console.log('[useVisioParticipation] 💓 Worker démarré')
        } else if (type === 'stopped') {
          console.log('[useVisioParticipation] 💔 Worker arrêté')
        } else if (type === 'error') {
          console.error('[useVisioParticipation] Erreur Worker:', e.data.error)
        }
      })

      // Gérer les erreurs du Worker
      heartbeatWorker.value.addEventListener('error', (error) => {
        console.error('[useVisioParticipation] Erreur Worker:', error)
      })

      // Démarrer le Worker (30 secondes)
      heartbeatWorker.value.postMessage({ command: 'start', interval: 30000 })

      // Premier heartbeat immédiat
      sendHeartbeat()

      console.log('[useVisioParticipation] 💓 Heartbeat démarré (Web Worker, 30s)')

    } catch (error) {
      console.error('[useVisioParticipation] Erreur création Worker:', error)
      // Fallback sur setInterval si Worker non supporté
      fallbackHeartbeat()
    }
  }

  /**
   * Fallback heartbeat avec setInterval (si Worker non supporté)
   */
  let fallbackInterval = null
  const fallbackHeartbeat = () => {
    console.warn('[useVisioParticipation] Fallback sur setInterval (Worker non supporté)')

    if (fallbackInterval) clearInterval(fallbackInterval)

    sendHeartbeat()
    fallbackInterval = setInterval(() => {
      sendHeartbeat()
    }, 30000)
  }

  /**
   * Arrêter le heartbeat (Worker ou fallback)
   */
  const stopHeartbeat = () => {
    // Arrêter le Worker
    if (heartbeatWorker.value) {
      heartbeatWorker.value.postMessage({ command: 'stop' })
      heartbeatWorker.value.terminate()
      heartbeatWorker.value = null
      console.log('[useVisioParticipation] 💔 Worker terminé')
    }

    // Arrêter le fallback
    if (fallbackInterval) {
      clearInterval(fallbackInterval)
      fallbackInterval = null
    }
  }

  /**
   * Envoyer un heartbeat au serveur
   */
  const sendHeartbeat = async () => {
    if (!isInVisio.value) return

    try {
      await lmsService.heartbeatVisio(seanceId)
      console.log(`[useVisioParticipation] 💓 Heartbeat envoyé (séance ${seanceId})`)
    } catch (error) {
      console.error('[useVisioParticipation] Erreur heartbeat:', error)

      // Si 404 (participation non trouvée), arrêter le heartbeat
      if (error.response?.status === 404) {
        console.warn('[useVisioParticipation] ⚠️ Participation non trouvée, arrêt heartbeat')
        stopHeartbeat()
        isInVisio.value = false
      }
    }
  }

  /**
   * Page Visibility API - Heartbeat immédiat au retour sur l'onglet
   */
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isInVisio.value) {
      console.log('[useVisioParticipation] 👁️ Retour sur onglet, heartbeat immédiat')
      sendHeartbeat()
    }
  }

  /**
   * Rejoindre une visioconférence
   * @param {string} jitsiLink - Lien Jitsi Meet à ouvrir
   * @returns {Promise<Object>} Réponse de l'API joinVisio
   */
  const joinVisio = async (jitsiLink) => {
    try {
      console.log(`[useVisioParticipation] Rejoindre séance ${seanceId}`)

      // 1. Enregistrer la participation dans la base
      const response = await lmsService.joinVisio(seanceId)

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de l\'enregistrement de la participation')
      }

      // 2. Ouvrir Jitsi dans une nouvelle fenêtre
      visioWindow.value = window.open(jitsiLink, '_blank')

      if (!visioWindow.value) {
        throw new Error('Impossible d\'ouvrir la fenêtre Jitsi. Vérifiez les popups.')
      }

      // 3. Marquer comme présent
      isInVisio.value = true

      // 4. Démarrer le heartbeat (Web Worker)
      startHeartbeat()

      // 5. Écouter les changements de visibilité de la page
      document.addEventListener('visibilitychange', handleVisibilityChange)

      // 6. Surveiller la fermeture de la fenêtre Jitsi
      watchVisioWindow()

      console.log(`[useVisioParticipation] ✅ Participation enregistrée, heartbeat démarré`)

      return response

    } catch (error) {
      console.error('[useVisioParticipation] Erreur rejoindre visio:', error)
      throw error
    }
  }

  /**
   * Quitter la visioconférence avec Beacon API
   * Beacon API garantit l'envoi même si l'onglet se ferme
   */
  const leaveVisio = async () => {
    if (!isInVisio.value) return

    try {
      console.log(`[useVisioParticipation] Quitter séance ${seanceId}`)

      // 1. Arrêter le heartbeat
      stopHeartbeat()

      // 2. Retirer l'écouteur de visibilité
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      // 3. Envoyer leaveVisio avec Beacon API (garanti même si fermeture brutale)
      const success = await sendLeaveVisioBeacon()

      if (!success) {
        // Fallback sur requête normale si Beacon échoue
        await lmsService.leaveVisio(seanceId)
      }

      // 4. Marquer comme absent
      isInVisio.value = false
      visioWindow.value = null

      console.log(`[useVisioParticipation] ✅ Sortie enregistrée`)

    } catch (error) {
      console.error('[useVisioParticipation] Erreur leave visio:', error)
      // Ne pas throw, on veut quand même nettoyer l'état local
    }
  }

  /**
   * Envoyer leaveVisio avec Beacon API
   * Garanti l'envoi même si l'onglet se ferme
   * @returns {Promise<boolean>} true si envoyé avec succès
   */
  const sendLeaveVisioBeacon = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/seances/${seanceId}/leave-visio`
      const token = localStorage.getItem('token')

      if (!token) {
        console.warn('[useVisioParticipation] Pas de token, impossible d\'envoyer Beacon')
        return false
      }

      // Utiliser Beacon API si disponible
      if (navigator.sendBeacon) {
        // Créer les données pour Beacon
        const formData = new FormData()
        formData.append('_token', token)

        // Envoyer le Beacon
        const success = navigator.sendBeacon(apiUrl, formData)

        if (success) {
          console.log('[useVisioParticipation] 📡 Beacon envoyé pour leaveVisio')
          return true
        } else {
          console.warn('[useVisioParticipation] Beacon échoué, fallback sur fetch')
          return false
        }
      }

      return false

    } catch (error) {
      console.error('[useVisioParticipation] Erreur Beacon:', error)
      return false
    }
  }

  /**
   * Surveiller la fermeture de la fenêtre Jitsi
   * Enregistre automatiquement la sortie quand l'utilisateur ferme Jitsi
   */
  const watchVisioWindow = () => {
    if (!visioWindow.value) return

    const checkClosed = setInterval(() => {
      if (visioWindow.value && visioWindow.value.closed) {
        clearInterval(checkClosed)
        console.log('[useVisioParticipation] 🚪 Fenêtre Jitsi fermée')
        leaveVisio()
      }
    }, 1000) // Vérifier toutes les secondes
  }

  /**
   * Nettoyage automatique au démontage du composant
   */
  const cleanup = () => {
    stopHeartbeat()
    document.removeEventListener('visibilitychange', handleVisibilityChange)

    if (isInVisio.value) {
      leaveVisio()
    }
  }

  // Nettoyage automatique au démontage du composant Vue
  onBeforeUnmount(() => {
    cleanup()
  })

  // Cleanup au beforeunload (fermeture navigateur/onglet)
  const handleBeforeUnload = () => {
    if (isInVisio.value) {
      // Utiliser Beacon pour garantir l'envoi
      sendLeaveVisioBeacon()
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  // API publique du composable
  return {
    // États
    isInVisio,
    visioWindow,

    // Méthodes
    joinVisio,
    leaveVisio,
    sendHeartbeat,
    cleanup
  }
}
