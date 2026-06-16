import { defineStore } from 'pinia'
import { ref } from 'vue'
import lmsService from '@/services/lms'
import { useAuthStore } from '@/stores/auth'
import { VISIO_CONFIG } from '@/constants/visio'

/**
 * Store Pinia global pour gérer la participation aux visioconférences
 *
 * ✅ AVANTAGES DE CETTE APPROCHE :
 * - État global persistant (ne se détruit pas lors de la navigation)
 * - Worker global (continue même si on change de page)
 * - Accessible depuis n'importe quel composant
 * - Pattern Vue recommandé
 *
 * ❌ PROBLÈME RÉSOLU :
 * Avant, le Worker était créé au niveau d'un composant et se détruisait
 * quand l'utilisateur changeait de page, causant l'arrêt des heartbeats.
 */
export const useVisioStore = defineStore('visio', () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // États réactifs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const activeSeanceId = ref(null)
  const isInVisio = ref(false)
  const visioWindow = ref(null)
  const heartbeatWorker = ref(null)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Gestion du Web Worker (Heartbeat)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
        const { type } = e.data

        if (type === 'heartbeat') {
          // Le Worker demande d'envoyer un heartbeat
          await sendHeartbeat()
        } else if (type === 'started') {
          console.log('[VisioStore] 💓 Worker démarré')
        } else if (type === 'stopped') {
          console.log('[VisioStore] 💔 Worker arrêté')
        } else if (type === 'error') {
          console.error('[VisioStore] Erreur Worker:', e.data.error)
        }
      })

      // Gérer les erreurs du Worker
      heartbeatWorker.value.addEventListener('error', (error) => {
        console.error('[VisioStore] Erreur Worker:', error)
      })

      // Démarrer le Worker (30 secondes)
      heartbeatWorker.value.postMessage({ command: 'start', interval: VISIO_CONFIG.HEARTBEAT_INTERVAL_MS })

      // Premier heartbeat immédiat
      sendHeartbeat()

      console.log('[VisioStore] 💓 Heartbeat démarré (Web Worker, 30s)')

    } catch (error) {
      console.error('[VisioStore] Erreur création Worker:', error)
      // Fallback sur setInterval si Worker non supporté
      fallbackHeartbeat()
    }
  }

  /**
   * Fallback heartbeat avec setInterval (si Worker non supporté)
   */
  let fallbackInterval = null
  const fallbackHeartbeat = () => {
    console.warn('[VisioStore] Fallback sur setInterval (Worker non supporté)')

    if (fallbackInterval) clearInterval(fallbackInterval)

    sendHeartbeat()
    fallbackInterval = setInterval(() => {
      sendHeartbeat()
    }, VISIO_CONFIG.HEARTBEAT_INTERVAL_MS)
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
      console.log('[VisioStore] 💔 Worker terminé')
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
    if (!isInVisio.value || !activeSeanceId.value) return

    try {
      await lmsService.heartbeatVisio(activeSeanceId.value)
      console.log(`[VisioStore] 💓 Heartbeat envoyé (séance ${activeSeanceId.value})`)
    } catch (error) {
      console.error('[VisioStore] Erreur heartbeat:', error)

      // Si 404 (participation non trouvée), arrêter le heartbeat
      if (error.response?.status === 404) {
        console.warn('[VisioStore] ⚠️ Participation non trouvée, arrêt heartbeat')
        stopHeartbeat()
        isInVisio.value = false
        activeSeanceId.value = null
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Page Visibility API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Heartbeat immédiat au retour sur l'onglet
   */
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isInVisio.value) {
      console.log('[VisioStore] 👁️ Retour sur onglet, heartbeat immédiat')
      sendHeartbeat()
    }
  }

  // Écouter les changements de visibilité (configuré une seule fois)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Actions principales
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Rejoindre une visioconférence
   * @param {number} seanceId - ID de la séance
   * @param {string} jitsiLink - Lien Jitsi Meet à ouvrir
   * @returns {Promise<Object>} Réponse de l'API joinVisio
   */
  const joinVisio = async (seanceId, jitsiLink) => {
    try {
      console.log(`[VisioStore] Rejoindre séance ${seanceId}`)

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

      // 3. Mettre à jour l'état global
      activeSeanceId.value = seanceId
      isInVisio.value = true

      // 4. Démarrer le heartbeat (Web Worker)
      startHeartbeat()

      // 5. Surveiller la fermeture de la fenêtre Jitsi
      watchVisioWindow()

      console.log(`[VisioStore] ✅ Participation enregistrée, heartbeat démarré`)

      return response

    } catch (error) {
      console.error('[VisioStore] Erreur rejoindre visio:', error)
      throw error
    }
  }

  /**
   * Quitter la visioconférence avec Beacon API
   * Beacon API garantit l'envoi même si l'onglet se ferme
   */
  const leaveVisio = async () => {
    if (!isInVisio.value || !activeSeanceId.value) return

    const seanceId = activeSeanceId.value

    try {
      console.log(`[VisioStore] Quitter séance ${seanceId}`)

      // 1. Arrêter le heartbeat
      stopHeartbeat()

      // 2. Envoyer leaveVisio avec Beacon API (garanti même si fermeture brutale)
      const success = await sendLeaveVisioBeacon(seanceId)

      if (!success) {
        // Fallback sur requête normale si Beacon échoue
        await lmsService.leaveVisio(seanceId)
      }

      // 3. Réinitialiser l'état global
      isInVisio.value = false
      activeSeanceId.value = null
      visioWindow.value = null

      console.log(`[VisioStore] ✅ Sortie enregistrée`)

    } catch (error) {
      console.error('[VisioStore] Erreur leave visio:', error)
      // Ne pas throw, on veut quand même nettoyer l'état local
      isInVisio.value = false
      activeSeanceId.value = null
      visioWindow.value = null
    }
  }

  /**
   * Envoyer leaveVisio avec Beacon API
   * Garanti l'envoi même si l'onglet se ferme
   * @param {number} seanceId - ID de la séance
   * @returns {Promise<boolean>} true si envoyé avec succès
   */
  const sendLeaveVisioBeacon = async (seanceId) => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/seances/${seanceId}/leave-visio`
      const token = useAuthStore().token

      if (!token) {
        console.warn('[VisioStore] Pas de token, impossible d\'envoyer Beacon')
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
          console.log('[VisioStore] 📡 Beacon envoyé pour leaveVisio')
          return true
        } else {
          console.warn('[VisioStore] Beacon échoué, fallback sur fetch')
          return false
        }
      }

      return false

    } catch (error) {
      console.error('[VisioStore] Erreur Beacon:', error)
      return false
    }
  }

  /**
   * Surveiller la fermeture de la fenêtre Jitsi
   * Enregistre automatiquement la sortie quand l'utilisateur ferme Jitsi
   * Si enseignant : propose de terminer la séance pour tous
   *
   * Détecte 2 cas :
   * 1. Fermeture de la fenêtre (X rouge)
   * 2. Clic sur "Quitter" dans Jitsi (URL change vers page de fermeture)
   */
  const watchVisioWindow = () => {
    if (!visioWindow.value) return

    let hasDetectedExit = false

    const checkClosed = setInterval(() => {
      if (hasDetectedExit) return // Éviter de déclencher 2 fois

      // Cas 1 : Fenêtre fermée (X rouge)
      if (visioWindow.value && visioWindow.value.closed) {
        hasDetectedExit = true
        clearInterval(checkClosed)
        console.log('[VisioStore] 🚪 Fenêtre Jitsi fermée (X rouge)')
        handleTeacherExit()
        return
      }

      // Cas 2 : URL a changé vers une page de fermeture (Quitter dans Jitsi)
      try {
        if (visioWindow.value && visioWindow.value.location) {
          const currentUrl = visioWindow.value.location.href

          // Détecter les pages de fermeture de Jitsi
          if (currentUrl.includes('close') ||
              currentUrl.includes('static/close') ||
              currentUrl.includes('thankYou') ||
              currentUrl.includes('goodbye')) {
            hasDetectedExit = true
            clearInterval(checkClosed)
            console.log('[VisioStore] 👋 Utilisateur a quitté Jitsi (bouton Quitter)')

            // Fermer la fenêtre popup après un court délai
            setTimeout(() => {
              if (visioWindow.value && !visioWindow.value.closed) {
                visioWindow.value.close()
              }
            }, 1000)

            handleTeacherExit()
            return
          }
        }
      } catch (e) {
        // Erreur CORS normale quand on ne peut pas accéder à l'URL
        // (domaine différent) - on ignore
      }
    }, 1000) // Vérifier toutes les secondes
  }

  /**
   * Gérer la sortie de l'enseignant (appelé par watchVisioWindow)
   */
  const handleTeacherExit = () => {
    // Se déconnecter d'abord
    leaveVisio()

    // Si enseignant : proposer de fermer la séance pour tous (#19 : user via store)
    const role = useAuthStore().currentUser?.role
    if (role === 'enseignant' || role === 'teacher') {
      // Utiliser setTimeout pour s'assurer que leaveVisio() est terminé
      setTimeout(() => {
        const shouldEnd = confirm(
          '🎓 Voulez-vous terminer la séance pour tous les participants ?\n\n' +
          '✅ OUI : La séance sera fermée pour tout le monde\n' +
          '❌ NON : Vous êtes déconnecté mais la séance reste ouverte'
        )

        if (shouldEnd && activeSeanceId.value) {
          console.log('[VisioStore] 🔚 Fermeture de la séance pour tous')
          lmsService.endVisio(activeSeanceId.value)
            .then(() => {
              console.log('[VisioStore] ✅ Séance fermée avec succès')
            })
            .catch((error) => {
              console.error('[VisioStore] ❌ Erreur fermeture séance:', error)
            })
        }
      }, 500)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Cleanup global (beforeunload)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Cleanup au beforeunload (fermeture navigateur/onglet)
   * IMPORTANT : Ne se déclenche que lors d'une vraie fermeture
   */
  const handleBeforeUnload = () => {
    if (isInVisio.value && activeSeanceId.value) {
      // Utiliser Beacon pour garantir l'envoi
      sendLeaveVisioBeacon(activeSeanceId.value)
    }
  }

  // Écouter beforeunload (configuré une seule fois)
  window.addEventListener('beforeunload', handleBeforeUnload)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // API publique du store
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return {
    // États
    activeSeanceId,
    isInVisio,
    visioWindow,

    // Actions
    joinVisio,
    leaveVisio,
    sendHeartbeat
  }
})
