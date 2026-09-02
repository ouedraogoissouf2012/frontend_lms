import { defineStore } from 'pinia'
import { ref } from 'vue'
import lmsService from '@/services/lms'
import { useAuthStore } from '@/stores/auth'
import { useVisioHeartbeat } from '@/composables/useVisioHeartbeat'
import { sendVisioLeaveBeacon } from '@/services/visioLeave'
import { buildJoinUrlFromResponse } from '@/constants/visio'
import { isTeacher } from '@/constants/roles'

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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Heartbeat (moteur Web Worker mutualisé — #26)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const { start: startHeartbeat, stop: stopHeartbeat, sendHeartbeat } = useVisioHeartbeat({
    getSeanceId: () => activeSeanceId.value,
    isActive: () => isInVisio.value,
    onParticipationLost: () => {
      isInVisio.value = false
      activeSeanceId.value = null
    },
    logPrefix: '[VisioStore]'
  })

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
   * Annule une participation déjà écrite côté serveur.
   *
   * `leaveVisio()` ne convient pas ici : il sort immédiatement tant que
   * `isInVisio` n'est pas posé — or à ce stade il ne l'est pas encore.
   * L'échec de compensation n'est jamais propagé : il ne doit pas masquer
   * l'erreur d'origine, qui est celle que l'utilisateur doit lire.
   */
  const compensateJoin = async (seanceId) => {
    try {
      await lmsService.leaveVisio(seanceId)
    } catch (error) {
      console.error('[VisioStore] Compensation de participation impossible:', error)
    }
  }

  /**
   * Rejoindre une visioconférence.
   *
   * L'URL de salle est construite ICI, à partir de la réponse de l'API, parce
   * que c'est elle qui porte le jeton d'accès. L'appelant ne fournit plus de
   * lien : il ne pouvait pas en construire un valide.
   *
   * @param {number} seanceId - ID de la séance
   * @param {{ displayName?: string, prejoinDisabled?: boolean }} [options]
   * @returns {Promise<Object>} Réponse de l'API joinVisio
   */
  const joinVisio = async (seanceId, options = {}) => {
    try {
      console.log(`[VisioStore] Rejoindre séance ${seanceId}`)

      // 1. Enregistrer la participation — et récupérer, dans LA MÊME réponse,
      //    la salle et le jeton d'accès. Construire l'URL avant cet appel
      //    condamnait le front à ignorer le jeton (#469).
      const response = await lmsService.joinVisio(seanceId)

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de l\'enregistrement de la participation')
      }

      // ⚠️ La présence est désormais ÉCRITE côté serveur. Tout échec au-delà de
      //    ce point doit être COMPENSÉ : sans quoi l'utilisateur reste marqué
      //    présent à une séance qu'il n'a jamais rejointe — et cette ligne
      //    alimente les rapports de présence.
      try {
        // 2. Construire l'URL (salle + jeton) puis ouvrir Jitsi
        visioWindow.value = window.open(buildJoinUrlFromResponse(response, options), '_blank')

        if (!visioWindow.value) {
          throw new Error('Impossible d\'ouvrir la fenêtre Jitsi. Vérifiez les popups.')
        }
      } catch (error) {
        await compensateJoin(seanceId)
        throw error
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
      const success = await sendVisioLeaveBeacon(seanceId)

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

  // sendLeaveVisioBeacon : déplacé dans @/services/visioLeave (fix Beacon).
  // fetch keepalive + Bearer vers la vraie route POST /api/lms/seances/:id/leave.

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
    const closedSeanceId = activeSeanceId.value

    // Se déconnecter d'abord
    leaveVisio()

    // Le store reste sans UI native : les écrans dédiés exposent l'action
    // "terminer pour tous" avec confirmation modale avant d'appeler endVisio().
    if (isTeacher(useAuthStore().currentUser)) {
      window.dispatchEvent(new CustomEvent('visio:teacher-left', {
        detail: { seanceId: closedSeanceId }
      }))
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
      sendVisioLeaveBeacon(activeSeanceId.value)
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
