<template>
  <div class="visio-manager">
    <!-- Coordinateur: Programmer / Désactiver visio -->
    <div v-if="canManageVisio">
      <button
        v-if="!seance.visio_enabled"
        @click="programmerVisio"
        class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        :disabled="loading"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {{ loading ? 'Programmation...' : 'Programmer en visio' }}
      </button>

      <button
        v-else
        @click="desactiverVisio"
        class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        :disabled="loading"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        {{ loading ? 'Désactivation...' : 'Désactiver visio' }}
      </button>
    </div>

    <!-- Enseignant: Démarrer la visio -->
    <div v-else-if="isTeacher">
      <!-- Info horaire séance -->
      <div v-if="seance.visio_enabled && seance.programmation?.heure_debut" class="text-sm text-gray-600 mb-2">
        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        Séance programmée: {{ formatTime(seance.programmation.heure_debut) }} - {{ formatTime(seance.programmation.heure_fin) }}
      </div>

      <!-- Bouton Démarrer (toujours actif pour l'enseignant) -->
      <button
        v-if="seance.visio_enabled"
        @click="demarrerVisio"
        :disabled="loading"
        class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ loading ? 'Démarrage...' : 'Démarrer la visio' }}
      </button>
    </div>

    <!-- Étudiant: Rejoindre la visio -->
    <div v-else-if="isStudent">
      <!-- Badge: Visio en cours -->
      <div v-if="seance.visio_active" class="flex items-center text-sm text-green-600 mb-2">
        <span class="relative flex h-3 w-3 mr-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        Visio en cours
      </div>

      <!-- Bouton Rejoindre (actif si visio en cours) -->
      <button
        v-if="seance.visio_enabled"
        @click="rejoindreVisio"
        :disabled="!seance.visio_active || loading"
        :class="[
          'inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors duration-200',
          seance.visio_active
            ? 'bg-purple-600 hover:bg-purple-700'
            : 'bg-gray-400 cursor-not-allowed'
        ]"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {{ loading ? 'Connexion...' : 'Rejoindre la visio' }}
      </button>

      <p v-if="!seance.visio_active && seance.visio_enabled" class="text-sm text-gray-500 mt-2">
        La visio sera disponible lorsque l'enseignant la démarrera
      </p>
    </div>

    <!-- Bouton: Voir les participants (Teachers and Coordinators only) -->
    <button
      v-if="seance.visio_enabled && (isTeacher || canManageVisio)"
      @click="showParticipants"
      class="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      Participants ({{ expectedParticipants }})
    </button>

    <!-- ParticipantsModal -->
    <ParticipantsModal
      v-if="showParticipantsModal"
      :seance-id="seance.id"
      @close="showParticipantsModal = false"
    />
  </div>
</template>

<script>
import { auth } from '@/services/api'
import lmsService from '@/services/lms'
import jitsiService from '@/services/jitsi'
import ParticipantsModal from './ParticipantsModal.vue'

export default {
  name: 'VisioManager',
  components: {
    ParticipantsModal
  },
  props: {
    seance: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      showParticipantsModal: false,
      participantCount: 0,
      currentTime: new Date(),
      timeCheckInterval: null,
      heartbeatInterval: null,
      isInVisio: false,
      visioWindow: null
    }
  },
  computed: {
    user() {
      return auth.getUser()
    },
    canManageVisio() {
      return this.user && ['coordinateur', 'superAdmin'].includes(this.user.role)
    },
    isTeacher() {
      return this.user && this.user.role === 'enseignant'
    },
    isStudent() {
      return this.user && this.user.role === 'etudiant'
    },
    /**
     * Nombre d'étudiants attendus pour cette séance
     */
    expectedParticipants() {
      return this.seance.classe_effectif || this.seance.classe?.effectif || 0
    },
    /**
     * Vérifier si on est dans la fenêtre temporelle:
     * - Début: heure_debut - 15 minutes
     * - Fin: heure_fin + 30 minutes
     */
    isInTimeWindow() {
      // Utiliser programmation.heure_debut/fin (ISO 8601)
      if (!this.seance.programmation?.heure_debut || !this.seance.programmation?.heure_fin) {
        return false
      }

      const debut = new Date(this.seance.programmation.heure_debut)
      const fin = new Date(this.seance.programmation.heure_fin)

      // Fenêtre temporelle: -15min avant, +30min après
      const windowStart = new Date(debut.getTime() - 15 * 60 * 1000) // -15min
      const windowEnd = new Date(fin.getTime() + 30 * 60 * 1000) // +30min

      return this.currentTime >= windowStart && this.currentTime <= windowEnd
    },
    timeWindowMessage() {
      if (!this.seance.programmation?.heure_debut) {
        return ''
      }

      const debut = new Date(this.seance.programmation.heure_debut)
      const windowStart = new Date(debut.getTime() - 15 * 60 * 1000)

      if (this.currentTime < windowStart) {
        const diffMinutes = Math.floor((windowStart - this.currentTime) / 60000)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60

        if (hours > 0) {
          return `dans ${hours}h ${minutes}min`
        }
        return `dans ${minutes} minutes`
      }

      return 'maintenant'
    }
  },
  mounted() {
    // Rafraîchir l'heure actuelle toutes les 30 secondes
    this.timeCheckInterval = setInterval(() => {
      this.currentTime = new Date()
    }, 30000)

    // NOTE: loadParticipantCount() désactivé car cause erreur 500
    // On utilise expectedParticipants (effectif classe) à la place
    // if (this.seance.visio_enabled) {
    //   this.loadParticipantCount()
    // }
  },
  beforeUnmount() {
    if (this.timeCheckInterval) {
      clearInterval(this.timeCheckInterval)
    }
    // Arrêter le heartbeat et appeler /leave si nécessaire
    this.stopHeartbeat()
    if (this.isInVisio) {
      this.leaveVisio()
    }
  },
  methods: {
    formatTime(isoTimestamp) {
      if (!isoTimestamp) return 'N/A'
      return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    /**
     * Coordinateur: Programmer la visio
     */
    async programmerVisio() {
      if (!confirm('Voulez-vous programmer une visioconférence Jitsi pour cette séance ?')) {
        return
      }

      this.loading = true
      try {
        const response = await lmsService.toggleVisio(this.seance.id, true, 'jitsi')

        if (response && response.success) {
          this.$emit('visio-updated', response.data)
          alert('Visioconférence programmée avec succès!')
        } else {
          throw new Error(response?.message || 'Erreur lors de la programmation')
        }
      } catch (error) {
        console.error('[VisioManager] Erreur programmation visio:', error)
        alert('Erreur lors de la programmation de la visio: ' + (error.response?.data?.message || error.message))
      } finally {
        this.loading = false
      }
    },

    /**
     * Coordinateur: Désactiver la visio
     */
    async desactiverVisio() {
      if (!confirm('Voulez-vous désactiver la visioconférence pour cette séance ?')) {
        return
      }

      this.loading = true
      try {
        const response = await lmsService.toggleVisio(this.seance.id, false)

        if (response && response.success) {
          this.$emit('visio-updated', response.data)
          alert('Visioconférence désactivée avec succès!')
        } else {
          throw new Error(response?.message || 'Erreur lors de la désactivation')
        }
      } catch (error) {
        console.error('[VisioManager] Erreur désactivation visio:', error)
        alert('Erreur lors de la désactivation de la visio: ' + (error.response?.data?.message || error.message))
      } finally {
        this.loading = false
      }
    },

    /**
     * Enseignant: Démarrer la visio
     */
    async demarrerVisio() {
      this.loading = true
      try {
        console.log('🎥 Démarrage visio par enseignant...')

        // 1. Démarrer la visio (change status à 'active')
        const result = await lmsService.startVisio(this.seance.id)

        if (!result.success) {
          alert(`Erreur: ${result.message}`)
          return
        }

        // 2. Générer lien Jitsi avec modération enseignant
        const roomId = result.data.visio_room_id || this.seance.visio?.room_id
        const link = `https://meet.jit.si/${roomId}#config.prejoinConfig.enabled=false&userInfo.displayName=${encodeURIComponent(this.user.name)}`

        // 3. Ouvrir Jitsi
        window.open(link, '_blank')

        // 4. Rafraîchir les données
        this.$emit('visio-updated', result.data)

        alert('Visioconférence démarrée ! Les étudiants peuvent maintenant rejoindre.')

      } catch (error) {
        console.error('[VisioManager] Erreur démarrage visio:', error)
        alert('Erreur lors du démarrage de la visio: ' + (error.response?.data?.message || error.message))
      } finally {
        this.loading = false
      }
    },

    /**
     * Étudiant: Rejoindre la visio (OPTION B: avec tracking)
     */
    async rejoindreVisio() {
      if (!this.seance.visio_active) {
        alert('La visio n\'est pas encore démarrée par l\'enseignant')
        return
      }

      this.loading = true
      try {
        console.log('👨‍🎓 Étudiant rejoint la visio...')

        // OPTION B: Appeler /join-visio pour:
        // 1. Vérifier que l'étudiant est inscrit
        // 2. Enregistrer sa participation
        const response = await lmsService.joinVisio(this.seance.id)

        if (!response.success) {
          alert(response.message || 'Vous n\'êtes pas autorisé à rejoindre cette visio')
          return
        }

        // Récupérer le room_id depuis la réponse
        const roomId = response.data.visio_room_id || this.seance.visio_room_id

        if (!roomId) {
          alert('Erreur: Room ID introuvable')
          return
        }

        // Générer lien Jitsi
        const link = `https://meet.jit.si/${roomId}#config.prejoinConfig.enabled=false&userInfo.displayName=${encodeURIComponent(this.user.name)}`

        // Ouvrir Jitsi
        this.visioWindow = window.open(link, '_blank')

        console.log('✅ Étudiant a rejoint la visio et participation enregistrée')

        // Marquer comme présent dans la visio
        this.isInVisio = true

        // Démarrer le heartbeat (ping toutes les 30s)
        this.startHeartbeat()

        // Surveiller la fermeture de la fenêtre Jitsi
        this.watchVisioWindow()

        // Émettre événement pour rafraîchir le compteur de participants
        this.$emit('participant-joined')

      } catch (error) {
        console.error('[VisioManager] Erreur rejoindre visio:', error)
        const errorMessage = error.response?.data?.message || error.message
        alert('Erreur lors de la connexion à la visio: ' + errorMessage)
      } finally {
        this.loading = false
      }
    },

    /**
     * Afficher les participants autorisés
     */
    showParticipants() {
      this.showParticipantsModal = true
    },

    /**
     * Charger le nombre de participants
     */
    async loadParticipantCount() {
      try {
        const response = await lmsService.getSeanceParticipants(this.seance.id)
        if (response && response.success) {
          this.participantCount = response.data.total || 0
        }
      } catch (error) {
        console.error('[VisioManager] Erreur chargement participants:', error)
      }
    },

    /**
     * Démarrer le système de heartbeat (ping toutes les 30 secondes)
     */
    startHeartbeat() {
      // Arrêter tout heartbeat existant
      this.stopHeartbeat()

      // Premier heartbeat immédiat
      this.sendHeartbeat()

      // Heartbeat toutes les 30 secondes
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat()
      }, 30000) // 30 secondes

      console.log('💓 Heartbeat démarré (ping toutes les 30s)')
    },

    /**
     * Arrêter le heartbeat
     */
    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
        console.log('💔 Heartbeat arrêté')
      }
    },

    /**
     * Envoyer un ping d'activité au serveur
     */
    async sendHeartbeat() {
      try {
        await lmsService.heartbeatVisio(this.seance.id)
        console.log('💓 Heartbeat envoyé')
      } catch (error) {
        console.error('[VisioManager] Erreur heartbeat:', error)
        // Si erreur 404 (participation non trouvée), arrêter le heartbeat
        if (error.response?.status === 404) {
          console.warn('⚠️ Participation non trouvée, arrêt du heartbeat')
          this.stopHeartbeat()
          this.isInVisio = false
        }
      }
    },

    /**
     * Enregistrer la sortie de la visio
     */
    async leaveVisio() {
      try {
        const response = await lmsService.leaveVisio(this.seance.id)
        console.log('👋 Sortie de visio enregistrée:', response)
        this.isInVisio = false
      } catch (error) {
        console.error('[VisioManager] Erreur leave visio:', error)
      }
    },

    /**
     * Surveiller la fermeture de la fenêtre Jitsi
     */
    watchVisioWindow() {
      if (!this.visioWindow) return

      const checkClosed = setInterval(() => {
        if (this.visioWindow.closed) {
          clearInterval(checkClosed)
          console.log('🚪 Fenêtre Jitsi fermée, arrêt heartbeat et enregistrement sortie')
          this.stopHeartbeat()
          this.leaveVisio()
          this.visioWindow = null
        }
      }, 1000) // Vérifier toutes les secondes
    }
  }
}
</script>

<style scoped>
.visio-manager {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
