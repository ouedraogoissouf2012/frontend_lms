<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <h1 class="text-white text-xl font-semibold">{{ courseTitle || 'Cours en ligne' }}</h1>
        <span v-if="roomName" class="text-gray-400 text-sm">Salle: {{ roomName }}</span>
      </div>
      <button
        @click="leaveMeeting"
        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
      >
        Quitter
      </button>
    </div>

    <!-- Jitsi Container -->
    <div id="jitsi-container" class="w-full" style="height: calc(100vh - 60px);"></div>

    <!-- Loading State -->
    <div v-if="loading" class="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
      <ContentLoader text="Chargement de la salle de cours..." />
    </div>
  </div>
</template>

<script>
import { auth } from '@/services/api'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { jitsiExternalApiSrc, getJitsiDomain } from '@/constants/visio'

export default {
  name: 'VideoConference',
  components: {
    ContentLoader
  },
  data() {
    return {
      jitsiApi: null,
      loading: true,
      user: null,
      roomName: this.$route.params.roomName,
      courseTitle: this.$route.query.title || null
    }
  },
  mounted() {
    this.user = auth.getUser()
    console.log('fa-user User joining video conference:', this.user)
    console.log('🎥 Room name:', this.roomName)

    if (!this.user) {
      console.error('fa-times-circle Utilisateur non connecté')
      this.$router.push('/login')
      return
    }

    this.loadJitsi()
  },
  beforeUnmount() {
    if (this.jitsiApi) {
      this.jitsiApi.dispose()
    }
  },
  methods: {
    loadJitsi() {
      // Vérifier si le script Jitsi est déjà chargé
      if (window.JitsiMeetExternalAPI) {
        this.initJitsi()
        return
      }

      // Charger le script Jitsi
      const script = document.createElement('script')
      script.src = jitsiExternalApiSrc()
      script.async = true
      script.onload = () => {
        console.log('fa-check-circle Script Jitsi chargé')
        this.initJitsi()
      }
      script.onerror = () => {
        console.error('fa-times-circle Erreur chargement script Jitsi')
        this.loading = false
        alert('Impossible de charger la visioconférence. Veuillez réessayer.')
      }
      document.head.appendChild(script)
    },

    initJitsi() {
      const domain = getJitsiDomain()
      const options = {
        roomName: this.roomName,
        width: '100%',
        height: '100%',
        parentNode: document.querySelector('#jitsi-container'),
        userInfo: {
          displayName: this.user.name,
          email: this.user.email
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
          ],
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false
        }
      }

      try {
        this.jitsiApi = new window.JitsiMeetExternalAPI(domain, options)

        // Événements
        this.jitsiApi.addListener('videoConferenceJoined', () => {
          console.log('fa-check-circle Vous avez rejoint la salle')
          this.loading = false
        })

        this.jitsiApi.addListener('videoConferenceLeft', () => {
          console.log('👋 Vous avez quitté la salle')
          this.leaveMeeting()
        })

        this.jitsiApi.addListener('readyToClose', () => {
          console.log('🚪 Prêt à fermer')
          this.leaveMeeting()
        })

        // Cacher le loader après 3 secondes même si l'événement ne se déclenche pas
        setTimeout(() => {
          this.loading = false
        }, 3000)

      } catch (error) {
        console.error('fa-times-circle Erreur initialisation Jitsi:', error)
        this.loading = false
        alert('Erreur lors de l\'initialisation de la visioconférence')
      }
    },

    async leaveMeeting() {
      try {
        // Enregistrer la déconnexion dans le backend
        const seanceId = this.$route.params.seanceId || this.$route.query.seanceId
        if (seanceId) {
          console.log('Enregistrement de la déconnexion pour la séance:', seanceId)
          const lmsService = await import('@/services/lms')
          await lmsService.default.leaveVisio(seanceId)
          console.log('Déconnexion enregistrée avec succès')
        } else {
          console.warn('Aucun seanceId trouvé pour enregistrer la déconnexion')
        }
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la déconnexion:', error)
        // Continue quand même pour quitter la visio
      }

      // Fermer l'interface Jitsi
      if (this.jitsiApi) {
        this.jitsiApi.dispose()
        this.jitsiApi = null
      }

      // Retourner au dashboard selon le rôle
      const role = this.user?.role
      if (role === 'enseignant') {
        this.$router.push('/teacher/dashboard')
      } else if (role === 'etudiant') {
        this.$router.push('/student/dashboard')
      } else {
        this.$router.push('/admin/dashboard')
      }
    }
  }
}
</script>

<style scoped>
#jitsi-container {
  background-color: #1a202c;
}
</style>
