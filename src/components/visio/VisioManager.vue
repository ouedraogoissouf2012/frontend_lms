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
        v-if="seance.visio_enabled && !seance.visio_active"
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

      <!-- Bouton Terminer pour tous (visible quand visio active) -->
      <button
        v-if="seance.visio_enabled && seance.visio_active"
        @click="terminerPourTous"
        :disabled="loading"
        class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        {{ loading ? 'Fermeture...' : 'Terminer pour tous' }}
      </button>

      <!-- Bouton Télécharger présences (visible après démarrage) -->
      <button
        v-if="seance.visio_enabled && seance.visio_started_at"
        @click="telechargerPresences"
        :disabled="loading"
        class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {{ loading ? 'Téléchargement...' : 'Télécharger présences (PDF)' }}
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
import { cleanupExpiredVisioParticipations } from '@/utils/visioParticipationCleanup'
import ParticipantsModal from './ParticipantsModal.vue'
import { VISIO_CONFIG } from '@/constants/visio'
import { formatVisioTime, isInTimeWindow, timeWindowMessage } from '@/utils/visioTimeWindow'
import { useVisioActions } from '@/composables/useVisioActions'

// Purge des participations visio expirées, au chargement du module (parité, ex-services/jitsi.js).
cleanupExpiredVisioParticipations()

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
  setup(props, { emit }) {
    // État (loading / participantCount) + orchestration des appels visio,
    // extraits dans le composable useVisioActions (comportement identique).
    return {
      ...useVisioActions(props, emit)
    }
  },
  data() {
    return {
      showParticipantsModal: false,
      currentTime: new Date(),
      timeCheckInterval: null
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
     * Fenêtre temporelle d'ouverture : -15min avant le début, +30min après la fin.
     * (logique pure extraite dans utils/visioTimeWindow.js)
     */
    isInTimeWindow() {
      return isInTimeWindow(this.seance, this.currentTime)
    },
    timeWindowMessage() {
      return timeWindowMessage(this.seance, this.currentTime)
    }
  },
  mounted() {
    // Rafraîchir l'heure actuelle toutes les 30 secondes
    this.timeCheckInterval = setInterval(() => {
      this.currentTime = new Date()
    }, VISIO_CONFIG.HEARTBEAT_INTERVAL_MS)

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
    // NOTE: Le cleanup de la visio est géré par le store global
    // Le store persiste lors de la navigation, évitant les déconnexions intempestives
  },
  methods: {
    formatTime(isoTimestamp) {
      return formatVisioTime(isoTimestamp)
    },

    /**
     * Afficher les participants autorisés
     */
    showParticipants() {
      this.showParticipantsModal = true
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
