import { defineStore } from 'pinia'
import { ref } from 'vue'
import lmsService from '@/services/lms'
import { useAuthStore } from '@/stores/auth'
import { useVisioHeartbeat } from '@/composables/useVisioHeartbeat'
import { sendVisioLeaveBeacon } from '@/services/visioLeave'
import { buildRoomConfigFromResponse } from '@/constants/visio'
import { isTeacher } from '@/constants/roles'

/**
 * Store Pinia global de participation aux visioconférences.
 *
 * ## Pourquoi un store global
 *
 * L'état ne doit pas se détruire à la navigation : le Worker de heartbeat
 * continue de battre pendant que l'utilisateur consulte une autre page, et
 * `VisioRoom` — monté à la racine de l'application — garde la salle ouverte.
 *
 * ## Ce que ce store ne fait PLUS (#673)
 *
 * Il n'ouvre plus d'onglet. `window.open` et la surveillance de la fenêtre
 * (état de fermeture sondé chaque seconde, `location.href` lu dans un `catch`
 * qui avalait les erreurs CORS) ont disparu au profit d'une salle embarquée :
 * la sortie provient désormais d'un événement Jitsi explicite, et le jeton ne
 * transite plus par l'URL.
 *
 * Le store décrit la salle à ouvrir ; c'est `VisioRoom` qui l'ouvre.
 */
export const useVisioStore = defineStore('visio', () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // États réactifs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const activeSeanceId = ref(null)
  const isInVisio = ref(false)

  /**
   * Description de la salle à ouvrir : domaine, salon, jeton, nom affiché.
   * `null` quand aucune visio n'est en cours. C'est le seul canal entre ce
   * store et le composant qui monte l'iframe.
   */
  const roomConfig = ref(null)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Heartbeat (moteur Web Worker mutualisé — #26)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const { start: startHeartbeat, stop: stopHeartbeat, sendHeartbeat } = useVisioHeartbeat({
    getSeanceId: () => activeSeanceId.value,
    isActive: () => isInVisio.value,
    onParticipationLost: () => {
      isInVisio.value = false
      activeSeanceId.value = null
      roomConfig.value = null
    },
    logPrefix: '[VisioStore]'
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Page Visibility API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Heartbeat immédiat au retour sur l'onglet. */
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isInVisio.value) {
      sendHeartbeat()
    }
  }

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
   * L'ordre des opérations porte un invariant : `join` écrit la présence en
   * base AVANT tout le reste. Tout échec postérieur doit donc être compensé,
   * sinon l'utilisateur reste marqué présent à une séance qu'il n'a jamais
   * rejointe — et cette ligne alimente les rapports de présence.
   *
   * @param {number} seanceId
   * @param {{ displayName?: string }} [options]
   * @returns {Promise<Object>} réponse de l'API join
   */
  const joinVisio = async (seanceId, options = {}) => {
    try {
      const response = await lmsService.joinVisio(seanceId)

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de l\'enregistrement de la participation')
      }

      // ⚠️ La présence est désormais ÉCRITE. Tout échec au-delà se compense.
      try {
        roomConfig.value = buildRoomConfigFromResponse(response, options)
      } catch (error) {
        await compensateJoin(seanceId)
        throw error
      }

      activeSeanceId.value = seanceId
      isInVisio.value = true
      startHeartbeat()

      return response

    } catch (error) {
      console.error('[VisioStore] Erreur rejoindre visio:', error)
      throw error
    }
  }

  /**
   * Quitter la visioconférence.
   *
   * Beacon API d'abord : elle garantit l'envoi même si l'onglet se ferme.
   */
  const leaveVisio = async () => {
    if (!isInVisio.value || !activeSeanceId.value) return

    const seanceId = activeSeanceId.value

    try {
      stopHeartbeat()

      const success = await sendVisioLeaveBeacon(seanceId)
      if (!success) {
        await lmsService.leaveVisio(seanceId)
      }
    } catch (error) {
      console.error('[VisioStore] Erreur leave visio:', error)
    } finally {
      // L'état local est nettoyé quoi qu'il arrive : laisser l'utilisateur
      // « en visio » après une sortie le priverait de toute nouvelle entrée.
      isInVisio.value = false
      activeSeanceId.value = null
      roomConfig.value = null
    }
  }

  /**
   * Vrai entre le premier signal de sortie et la fin du `leaveVisio` qu'il a
   * déclenché. Volontairement hors de Vue : la garde doit être posée de façon
   * SYNCHRONE, avant tout `await`.
   */
  let leaving = false

  /**
   * Sortie de salle signalée par Jitsi (`videoConferenceLeft` / `readyToClose`).
   *
   * Remplace la surveillance d'une fenêtre externe : l'événement est exact,
   * là où le sondage de la fenêtre chaque seconde ne l'était pas — il
   * confondait fermeture, navigation et blocage de popup, et lisait
   * `location.href` dans un `catch` qui avalait les erreurs CORS.
   *
   * ⚠️ Jitsi émet `videoConferenceLeft` PUIS `readyToClose` pour une SEULE et
   * même sortie. Comme `leaveVisio()` est asynchrone, `isInVisio` vaut encore
   * `true` quand le second arrive : sans la garde synchrone ci-dessous,
   * l'enseignant se verrait proposer DEUX FOIS de terminer la séance pour tous.
   */
  const handleRoomLeft = () => {
    if (leaving || !isInVisio.value || !activeSeanceId.value) return
    leaving = true

    const closedSeanceId = activeSeanceId.value

    void leaveVisio().finally(() => { leaving = false })

    // Le store reste sans UI native : les écrans dédiés exposent l'action
    // « terminer pour tous » avec confirmation modale avant d'appeler endVisio().
    if (isTeacher(useAuthStore().currentUser)) {
      window.dispatchEvent(new CustomEvent('visio:teacher-left', {
        detail: { seanceId: closedSeanceId }
      }))
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Cleanup global (beforeunload)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Fermeture du navigateur/onglet : Beacon garantit l'envoi. */
  const handleBeforeUnload = () => {
    if (isInVisio.value && activeSeanceId.value) {
      sendVisioLeaveBeacon(activeSeanceId.value)
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  return {
    // États
    activeSeanceId,
    isInVisio,
    roomConfig,

    // Actions
    joinVisio,
    leaveVisio,
    handleRoomLeft,
    sendHeartbeat
  }
})
