import { ref, onMounted, onBeforeUnmount } from 'vue'
import lmsService from '@/services/lms'
import { useVisioHeartbeat } from '@/composables/useVisioHeartbeat'
import { jitsiExternalApiSrc, getJitsiDomain } from '@/constants/visio'

/**
 * Couche logique de JitsiMeet (#h13 ≤300) : chargement dynamique du script
 * Jitsi External API, initialisation de l'IFrame API, abonnement aux événements
 * de conférence (join/leave/readyToClose/participants), heartbeat d'activité et
 * nettoyage au démontage. Le composant ne fait plus que câbler refs + overlays.
 *
 * Le heartbeat utilise le moteur partagé `useVisioHeartbeat` pour éviter un
 * second setInterval divergent entre l'iframe Jitsi et le flux popup/store.
 *
 * @param {Object} opts
 * @param {import('vue').Ref<number>}  opts.seanceId  - id de la séance (réactif via toRef côté vue)
 * @param {import('vue').Ref<string>}  opts.jitsiLink - lien Jitsi de la salle
 * @param {import('vue').Ref<string>}  opts.userName  - nom affiché du participant
 * @param {import('vue').Ref<string>}  opts.userEmail - email du participant
 * @param {(event: string, payload?: any) => void} opts.emit - relais d'événements vers le composant
 * @returns {{
 *   jitsiContainer: import('vue').Ref<HTMLElement|null>,
 *   isLoading: import('vue').Ref<boolean>,
 *   error: import('vue').Ref<string|null>,
 *   cleanup: () => Promise<void>
 * }}
 */
export function useJitsiMeet({ seanceId, jitsiLink, userName, userEmail, emit }) {
  // États
  const jitsiContainer = ref(null)
  const jitsiApi = ref(null)
  const isLoading = ref(true)
  const error = ref(null)
  const hasJoined = ref(false)

  const { start: startHeartbeat, stop: stopHeartbeat } = useVisioHeartbeat({
    getSeanceId: () => seanceId.value,
    isActive: () => hasJoined.value,
    onParticipationLost: () => {
      hasJoined.value = false
    },
    logPrefix: '[JitsiMeet]'
  })

  /**
   * Extraire le nom de la room depuis le lien Jitsi
   * https://meet.jit.si/RoomName -> RoomName
   */
  const extractRoomName = (link) => {
    try {
      const url = new URL(link)
      return url.pathname.substring(1) // Enlever le "/" au début
    } catch (e) {
      console.error('Erreur extraction room name:', e)
      return null
    }
  }

  /**
   * Charger le script Jitsi External API dynamiquement
   */
  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      // Vérifier si le script est déjà chargé
      if (window.JitsiMeetExternalAPI) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = jitsiExternalApiSrc()
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  /**
   * Initialiser Jitsi Meet avec l'API
   */
  const initJitsi = async () => {
    try {
      isLoading.value = true
      error.value = null

      // 1. Charger le script Jitsi API
      await loadJitsiScript()

      // 2. Extraire le nom de la room
      const roomName = extractRoomName(jitsiLink.value)
      if (!roomName) {
        throw new Error('Lien Jitsi invalide')
      }

      console.log(`[JitsiMeet] Initialisation room: ${roomName}`)

      // 3. Configuration Jitsi
      const domain = getJitsiDomain()
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainer.value,
        userInfo: {
          displayName: userName.value,
          email: userEmail.value
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false, // Désactiver la page de préparation
          disableDeepLinking: true
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'download', 'help', 'mute-everyone'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false
        }
      }

      // 4. Créer l'instance Jitsi
      jitsiApi.value = new window.JitsiMeetExternalAPI(domain, options)

      // 5. Enregistrer les événements
      setupJitsiEvents()

      isLoading.value = false

    } catch (err) {
      console.error('[JitsiMeet] Erreur initialisation:', err)
      error.value = 'Erreur lors de la connexion à Jitsi'
      emit('error', err)
      isLoading.value = false
    }
  }

  /**
   * Configurer les événements Jitsi
   */
  const setupJitsiEvents = () => {
    if (!jitsiApi.value) return

    // Événement: Conférence rejointe (l'utilisateur a rejoint)
    jitsiApi.value.addEventListener('videoConferenceJoined', async (event) => {
      console.log('[JitsiMeet] ✅ Conférence rejointe:', event)
      hasJoined.value = true

      try {
        // Enregistrer la participation dans la base
        const response = await lmsService.joinVisio(seanceId.value)

        if (response.success) {
          console.log('[JitsiMeet] Participation enregistrée dans la base')
          emit('joined', event)

          // Démarrer le heartbeat automatique
          startHeartbeat()
        } else {
          throw new Error(response.message || 'Erreur enregistrement participation')
        }
      } catch (error) {
        console.error('[JitsiMeet] Erreur joinVisio:', error)
        emit('error', error)
      }
    })

    // Événement: Conférence quittée (l'utilisateur a quitté)
    jitsiApi.value.addEventListener('videoConferenceLeft', async (event) => {
      console.log('[JitsiMeet] 🚪 Conférence quittée:', event)
      hasJoined.value = false

      try {
        // Arrêter le heartbeat
        stopHeartbeat()

        // Enregistrer la sortie dans la base
        await lmsService.leaveVisio(seanceId.value)
        console.log('[JitsiMeet] Sortie enregistrée dans la base')
        emit('left', event)

        // Fermer la modal
        emit('close')
      } catch (error) {
        console.error('[JitsiMeet] Erreur leaveVisio:', error)
      }
    })

    // Événement: Prêt à recevoir des commandes
    jitsiApi.value.addEventListener('readyToClose', () => {
      console.log('[JitsiMeet] Prêt à fermer')
      cleanup()
      emit('close')
    })

    // Événement: Participant a rejoint
    jitsiApi.value.addEventListener('participantJoined', (event) => {
      console.log('[JitsiMeet] 👤 Participant rejoint:', event)
    })

    // Événement: Participant a quitté
    jitsiApi.value.addEventListener('participantLeft', (event) => {
      console.log('[JitsiMeet] 👋 Participant quitté:', event)
    })
  }

  /**
   * Nettoyage
   */
  const cleanup = async () => {
    console.log('[JitsiMeet] Nettoyage...')

    // Arrêter le heartbeat
    stopHeartbeat()

    // Si l'utilisateur a rejoint, enregistrer la sortie
    if (hasJoined.value) {
      try {
        await lmsService.leaveVisio(seanceId.value)
        console.log('[JitsiMeet] Sortie enregistrée lors du cleanup')
      } catch (error) {
        console.error('[JitsiMeet] Erreur cleanup leaveVisio:', error)
      }
    }

    // Détruire l'instance Jitsi
    if (jitsiApi.value) {
      jitsiApi.value.dispose()
      jitsiApi.value = null
    }

    hasJoined.value = false
  }

  // Lifecycle hooks
  onMounted(() => {
    initJitsi()
  })

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    jitsiContainer,
    isLoading,
    error,
    cleanup
  }
}
