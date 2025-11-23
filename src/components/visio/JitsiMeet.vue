<template>
  <div class="jitsi-container">
    <!-- Conteneur pour l'iframe Jitsi -->
    <div ref="jitsiContainer" class="jitsi-iframe-wrapper"></div>

    <!-- Overlay de chargement -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="mt-4 text-white">Connexion à la visioconférence...</p>
      </div>
    </div>

    <!-- Erreur -->
    <div v-if="error" class="error-overlay">
      <div class="error-content">
        <p class="text-red-600 font-semibold">{{ error }}</p>
        <button @click="$emit('close')" class="mt-4 px-4 py-2 bg-red-600 text-white rounded">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import lmsService from '@/services/lms'

const props = defineProps({
  seanceId: {
    type: Number,
    required: true
  },
  jitsiLink: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'joined', 'left', 'error'])

// États
const jitsiContainer = ref(null)
const jitsiApi = ref(null)
const isLoading = ref(true)
const error = ref(null)
const hasJoined = ref(false)

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
    script.src = 'https://meet.jit.si/external_api.js'
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
    const roomName = extractRoomName(props.jitsiLink)
    if (!roomName) {
      throw new Error('Lien Jitsi invalide')
    }

    console.log(`[JitsiMeet] Initialisation room: ${roomName}`)

    // 3. Configuration Jitsi
    const domain = 'meet.jit.si'
    const options = {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainer.value,
      userInfo: {
        displayName: props.userName,
        email: props.userEmail
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
      const response = await lmsService.joinVisio(props.seanceId)

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
      await lmsService.leaveVisio(props.seanceId)
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
 * Système de heartbeat automatique
 */
let heartbeatInterval = null

const startHeartbeat = () => {
  stopHeartbeat() // Arrêter tout heartbeat existant

  // Heartbeat toutes les 30 secondes
  heartbeatInterval = setInterval(async () => {
    if (!hasJoined.value) {
      stopHeartbeat()
      return
    }

    try {
      await lmsService.heartbeatVisio(props.seanceId)
      console.log(`[JitsiMeet] 💓 Heartbeat envoyé (séance ${props.seanceId})`)
    } catch (error) {
      console.error('[JitsiMeet] Erreur heartbeat:', error)

      // Si 404, la participation n'existe plus, arrêter le heartbeat
      if (error.response?.status === 404) {
        console.warn('[JitsiMeet] ⚠️ Participation non trouvée, arrêt heartbeat')
        stopHeartbeat()
        hasJoined.value = false
      }
    }
  }, 30000) // 30 secondes

  console.log('[JitsiMeet] 💓 Heartbeat démarré (ping toutes les 30s)')
}

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
    console.log('[JitsiMeet] 💔 Heartbeat arrêté')
  }
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
      await lmsService.leaveVisio(props.seanceId)
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

// Exposer cleanup pour pouvoir l'appeler depuis le parent
defineExpose({
  cleanup
})
</script>

<style scoped>
.jitsi-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: #000;
}

.jitsi-iframe-wrapper {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3b82f6;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.error-content {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
}
</style>
