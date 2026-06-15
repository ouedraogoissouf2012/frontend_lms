<template>
  <DashboardLayout>
  <div class="seance-details">
    <!-- Loading -->
    <ContentLoader v-if="loading" text="Chargement de la séance..." />

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-900 font-medium">{{ error }}</p>
      <button
        @click="loadSeanceDetails"
        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        Réessayer
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="seance">
      <!-- Header -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <button
                @click="$router.back()"
                class="text-gray-600 hover:text-gray-900"
              >
                ← Retour
              </button>
              <h1 class="text-2xl font-bold text-gray-900">
                {{ seance.matiere?.nom || 'Séance' }}
              </h1>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-600">Date</p>
                <p class="font-semibold text-gray-900">{{ formatDate(seance.programmation?.date) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Horaire</p>
                <p class="font-semibold text-gray-900">
                  {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
                  <span class="text-gray-500">({{ seance.duree_minutes }} min)</span>
                </p>
              </div>
              <div>
                <p class="text-gray-600">Enseignant</p>
                <p class="font-semibold text-gray-900">
                  {{ seance.enseignant?.nom || (participants?.teacher ? `${participants.teacher.prenom || ''} ${participants.teacher.nom || ''}`.trim() || participants.teacher.nom : 'Non assigné') }}
                </p>
              </div>
              <div>
                <p class="text-gray-600">Classe</p>
                <p class="font-semibold text-gray-900">{{ seance.classe?.nom }}</p>
              </div>
              <div v-if="seance.programmation?.salle">
                <p class="text-gray-600">Salle</p>
                <p class="font-semibold text-gray-900">{{ seance.programmation.salle }}</p>
              </div>
            </div>
          </div>

          <!-- Bouton Masquer (étudiants uniquement) -->
          <button
            v-if="!isTeacher"
            @click="hideSeance"
            class="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2"
            title="Masquer cette séance de ma liste"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Masquer cette séance
          </button>
        </div>
      </div>

      <!-- Visioconférence Section -->
      <div v-if="visio && visio.enabled" class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fa fa-dot-circle-o visio-header-icon"></i> Visioconférence {{ visio.type }}
        </h2>

        <!-- Fenêtre temporelle info -->
        <div
          v-if="visio.window"
          :class="[
            'mb-4 p-4 rounded-lg border-2',
            visio.window.is_in_window ? 'bg-green-50 border-green-300' :
            !visio.window.has_started ? 'bg-orange-50 border-orange-300' :
            'bg-gray-50 border-gray-300'
          ]"
        >
          <p class="font-medium">
            <span v-if="!visio.window.has_started">
              <i class="fa fa-clock-o status-icon"></i> La visio ouvrira 15 minutes avant le cours
            </span>
            <span v-else-if="visio.window.is_in_window">
              <i class="fa fa-check status-icon"></i> Fenêtre visio active
            </span>
            <span v-else>
              <span class="status-icon">■</span> Fenêtre visio fermée
            </span>
          </p>
        </div>

        <!-- Bouton Enseignant / Coordinateur -->
        <div v-if="isTeacher">
          <!-- Si le cours est déjà actif, permettre de rejoindre (pour coordinateur aussi) -->
          <div v-if="visio.status === 'active'">
            <div class="mb-3 p-3 bg-red-50 border-2 border-red-400 rounded-lg text-center">
              <span class="text-red-600 font-bold text-lg"><i class="fa fa-circle text-red"></i> COURS EN DIRECT</span>
            </div>
            <button
              @click="joinVisio"
              class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <i class="fa fa-dot-circle-o btn-icon"></i> Rejoindre le cours
            </button>
          </div>
          <!-- Sinon, afficher le bouton de démarrage (enseignant seulement) -->
          <div v-else>
            <button
              v-if="visio.window?.can_start"
              @click="startVisio"
              class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <i class="fa fa-play btn-icon"></i> Démarrer le cours
            </button>
            <div v-else class="text-center py-4 text-gray-600">
              <p v-if="!visio.window?.has_started">
                Vous pourrez démarrer le cours 15 minutes avant l'heure prévue
              </p>
              <p v-else>
                La fenêtre pour démarrer le cours est fermée
              </p>
            </div>
          </div>
        </div>

        <!-- Bouton Étudiant -->
        <div v-else-if="isStudent">
          <!-- Cours EN DIRECT: Accessible si status = 'active' OU dans la fenêtre temporelle -->
          <div v-if="visio.status === 'active' || (visio.window?.is_accessible && roomActive)">
            <div v-if="visio.status === 'active'" class="mb-3 p-3 bg-red-50 border-2 border-red-400 rounded-lg text-center">
              <span class="text-red-600 font-bold text-lg"><i class="fa fa-circle text-red"></i> COURS EN DIRECT</span>
            </div>

            <button
              @click="joinVisio"
              :disabled="joiningVisio"
              class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span v-if="!joiningVisio"><i class="fa fa-dot-circle-o btn-icon"></i> Rejoindre le cours</span>
              <span v-else><i class="fa fa-clock-o waiting-icon"></i> Validation en cours...</span>
            </button>
          </div>

          <!-- Cours pas encore démarré -->
          <div v-else-if="!visio.window?.has_started" class="text-center py-6">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
              <i class="fa fa-clock-o waiting-icon"></i> En attente de l'enseignant
            </div>
            <p class="mt-2 text-sm text-gray-600">
              Le cours commencera à {{ seance.heure_debut }}
            </p>
          </div>

          <!-- Cours terminé -->
          <div v-else-if="visio.window?.has_ended" class="text-center py-6">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
              <i class="fa fa-check finished-icon"></i> Cours terminé
            </div>
            <p v-if="visio.recording_url" class="mt-4">
              <a
                :href="visio.recording_url"
                target="_blank"
                class="text-blue-600 hover:underline"
              >
                <i class="fa fa-play recording-icon"></i> Voir l'enregistrement
              </a>
            </p>
          </div>

          <!-- Fallback: en attente -->
          <div v-else class="text-center py-6 text-gray-600">
            <p>En attente du démarrage par l'enseignant...</p>
          </div>
        </div>

        <!-- Info Room -->
        <div v-if="visio.room_id" class="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
          <p><strong>Room ID:</strong> {{ visio.room_id }}</p>
        </div>
      </div>

      <!-- Présentiel -->
      <div v-else class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex items-center gap-3 text-blue-600">
          <i class="fa fa-diamond presentiel-icon"></i>
          <div>
            <p class="font-semibold">Cours en présentiel</p>
            <p class="text-sm text-gray-600">Salle: {{ seance.salle || 'À définir' }}</p>
          </div>
        </div>
      </div>

      <!-- Participants (Teachers and Coordinators only) -->
      <div v-if="isTeacher" class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          Participants ({{ participants.total }})
        </h2>

        <!-- Teacher -->
        <div v-if="participants.teacher" class="mb-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-600 font-medium">Enseignant</p>
          <p class="font-semibold text-gray-900">
            {{ participants.teacher.prenom }} {{ participants.teacher.nom }}
          </p>
        </div>

        <!-- Students -->
        <div v-if="participants.students && participants.students.length > 0">
          <p class="text-sm text-gray-600 font-medium mb-2">
            Étudiants ({{ participants.students.length }})
          </p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div
              v-for="student in participants.students"
              :key="student.id"
              class="p-2 bg-gray-50 rounded text-sm"
            >
              {{ student.prenom }} {{ student.nom }}
            </div>
          </div>
        </div>

        <div v-else class="text-center py-6 text-gray-500">
          <p>Aucun étudiant inscrit</p>
        </div>
      </div>
    </div>
  </div>
  </DashboardLayout>
</template>

<script>
import lmsService from '@/services/lms'
import { auth } from '@/services/api'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'

export default {
  name: 'SeanceDetails',

  components: {
    DashboardLayout,
    ContentLoader
  },

  setup() {
    // Le composable sera initialisé dans mounted() quand on aura le seanceId
    return {}
  },

  data() {
    return {
      loading: false,
      error: null,
      seance: null,
      visio: null,
      participants: {
        teacher: null,
        students: [],
        total: 0
      },
      roomActive: false, // Géré par le LMS (statut room)
      joiningVisio: false,
      visioParticipation: null  // Composable pour le tracking
    }
  },

  computed: {
    seanceId() {
      return parseInt(this.$route.params.id)
    },

    user() {
      return auth.getUser()
    },

    isTeacher() {
      return this.user && ['enseignant', 'coordinateur', 'teacher'].includes(this.user.role)
    },

    isStudent() {
      // Accepter à la fois 'etudiant' (sans accent) et 'étudiant' (avec accent)
      return this.user && ['etudiant', 'étudiant', 'student'].includes(this.user.role)
    }
  },

  mounted() {
    this.loadSeanceDetails()
    // Polling pour vérifier le statut de la room (optionnel)
    // this.startRoomStatusPolling()
  },

  methods: {
    async loadSeanceDetails() {
      this.loading = true
      this.error = null

      try {
        console.log('fa-calendar Chargement détails séance:', this.seanceId)

        const data = await lmsService.getSeanceDetails(this.seanceId)

        console.log('fa-check-circle Données séance reçues:', data)

        if (data.success) {
          this.seance = data.data.seance
          this.visio = data.data.visio

          // Les participants ne sont retournés QUE pour les enseignants/coordinateurs
          // Pour les étudiants, participants sera undefined
          if (data.data.participants) {
            this.participants = data.data.participants
          } else {
            // Garder les valeurs par défaut pour les étudiants
            this.participants = {
              teacher: null,
              students: [],
              total: 0
            }
          }

          // Vérifier si la room est accessible (nouveau champ is_accessible)
          this.roomActive = this.visio?.window?.is_accessible || false

          console.log('📹 Visio:', this.visio?.enabled ? 'Activée' : 'Désactivée')
          console.log('📹 Status:', this.visio?.status || 'null')
          console.log('fa-clock-o Fenêtre accessible:', this.roomActive)
          console.log('fa-users Participants inclus:', data.data.participants ? 'Oui (enseignant)' : 'Non (étudiant)')
        } else {
          this.error = 'Séance non trouvée'
        }
      } catch (error) {
        console.error('fa-times-circle Erreur chargement séance:', error)
        this.error = 'Erreur lors du chargement de la séance'
      } finally {
        this.loading = false
      }
    },

    async startVisio() {
      if (!this.user) {
        alert('Vous devez être connecté')
        return
      }

      try {
        console.log('🎥 Démarrage visio par enseignant...')

        // 1. Démarrer la visio (change status à 'active')
        const result = await lmsService.startVisio(this.seanceId)

        console.log('fa-check-circle Visio démarrée:', result)

        if (!result.success) {
          alert(`Erreur: ${result.message}`)
          return
        }

        // 2. Générer lien Jitsi avec modération
        const roomId = result.data.visio_room_id || this.visio.room_id
        const link = `https://meet.jit.si/${roomId}#config.prejoinConfig.enabled=false&userInfo.displayName=${encodeURIComponent(this.user.name)}`

        // 3. Marquer comme active localement
        this.roomActive = true

        // Recharger les détails pour voir le nouveau status
        await this.loadSeanceDetails()

        // 4. Ouvrir Jitsi
        window.open(link, '_blank')

        alert('Visioconférence démarrée ! Les étudiants peuvent maintenant rejoindre.')
      } catch (error) {
        console.error('Erreur démarrage visio:', error)
        alert('Erreur lors du démarrage de la visioconférence')
      }
    },

    async joinVisio() {
      if (!this.user) {
        alert('Vous devez être connecté')
        return
      }

      // Vérifier si la visio est activée ET active (status = 'active')
      if (!this.visio || !this.visio.enabled) {
        alert('La visioconférence n\'est pas activée pour cette séance.')
        return
      }

      if (this.visio.status !== 'active') {
        alert('La visioconférence n\'est pas encore active. Veuillez attendre que l\'enseignant démarre le cours.')
        return
      }

      this.joiningVisio = true

      try {
        console.log('👨‍fa-graduation-cap Étudiant rejoint la visio...')

        // Initialiser le composable si pas déjà fait
        if (!this.visioParticipation) {
          this.visioParticipation = useVisioParticipation(this.seanceId)
        }

        // Récupérer le room_id depuis la visio
        const roomId = this.visio?.room_id || `seance_${this.seanceId}`

        // Générer lien Jitsi
        const displayName = encodeURIComponent(this.user.name)
        const link = `https://meet.jit.si/${roomId}#config.prejoinConfig.enabled=false&userInfo.displayName=${displayName}`

        console.log('🔗 Lien Jitsi:', link)

        // Utiliser le composable pour ouvrir et tracker
        await this.visioParticipation.joinVisio(link)

        console.log('fa-check-circle Étudiant a rejoint la visio avec Web Worker heartbeat')
      } catch (error) {
        console.error('fa-times-circle Erreur rejoindre visio:', error)

        // Afficher un message d'erreur plus détaillé
        let errorMessage = 'Erreur lors de la connexion à la visioconférence.'

        if (error.response && error.response.data) {
          const data = error.response.data
          if (data.message) {
            errorMessage = data.message
          } else if (data.reason) {
            const errorMessages = {
              'visio_not_enabled': 'La visioconférence n\'est pas activée.',
              'visio_not_started': 'La visioconférence n\'a pas encore démarré.',
              'not_enrolled': 'Vous n\'êtes pas inscrit dans cette classe.',
              'seance_not_found': 'Séance non trouvée dans le système.'
            }
            errorMessage = errorMessages[data.reason] || data.reason
          }
        }

        alert(`fa-times-circle ${errorMessage}`)
      } finally {
        this.joiningVisio = false
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
          console.log('🚪 Fenêtre Jitsi fermée, enregistrement sortie')
          this.leaveVisio()
          this.visioWindow = null
        }
      }, 1000) // Vérifier toutes les secondes
    },

    /**
     * Enregistrer la sortie de la visio
     */
    async leaveVisio() {
      try {
        const response = await lmsService.leaveVisio(this.seanceId)
        console.log('👋 Sortie de visio enregistrée:', response)
      } catch (error) {
        console.error('fa-times-circle Erreur leave visio:', error)
      }
    },

    formatDate(date) {
      if (!date) return 'Non défini'
      return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    async hideSeance() {
      if (!confirm('Voulez-vous vraiment masquer cette séance de votre liste ?')) {
        return
      }

      try {
        const seanceId = this.seance.id || this.seance.klassci_seance_id
        const response = await lmsService.hideSeance(seanceId)

        if (response.success) {
          alert('fa-check Séance masquée avec succès')
          // Retourner à la page précédente
          this.$router.back()
        }
      } catch (error) {
        console.error('[SeanceDetails] Erreur masquage séance:', error)
        toast.error(error.userMessage ?? normalizeError(error).userMessage)
      }
    },

    formatTime(isoTimestamp) {
      if (!isoTimestamp) return 'Non défini'
      return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.seance-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-primary);
}

/* Cards - Style cohérent avec le reste de l'app */
.seance-details > div {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  margin-bottom: 1.5rem;
  transition: all 0.2s ease;
}

.seance-details > div:hover {
  box-shadow: var(--card-shadow-hover, 0 4px 6px rgba(0, 0, 0, 0.15));
}

/* Header card styling */
.bg-white {
  background: var(--card-bg) !important;
}

.shadow {
  box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1)) !important;
}

/* Text colors */
.text-gray-600,
.text-gray-500 {
  color: var(--text-secondary) !important;
}

.text-gray-900 {
  color: var(--text-primary) !important;
}

.text-gray-800 {
  color: var(--text-primary) !important;
}

/* Buttons */
button {
  background: var(--color-primary, #10b981);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Status badges */
.bg-green-100,
.bg-green-50 {
  background: rgba(16, 185, 129, 0.1) !important;
  color: var(--color-primary, #10b981) !important;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.bg-blue-100,
.bg-blue-50 {
  background: rgba(59, 130, 246, 0.1) !important;
  color: #3b82f6 !important;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.bg-yellow-100,
.bg-orange-100,
.bg-orange-50 {
  background: rgba(245, 158, 11, 0.1) !important;
  color: #f59e0b !important;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.bg-gray-100,
.bg-gray-50 {
  background: var(--bg-secondary) !important;
  color: var(--text-secondary) !important;
  border: 1px solid var(--border-color);
}

/* Border colors */
.border-green-300 {
  border-color: rgba(16, 185, 129, 0.5) !important;
}

.border-orange-300 {
  border-color: rgba(245, 158, 11, 0.5) !important;
}

.border-gray-300 {
  border-color: var(--border-color) !important;
}

/* Text colors orange */
.text-orange-700 {
  color: #c2410c !important;
}

/* Borders */
.border {
  border-color: var(--border-color) !important;
}

.border-gray-200 {
  border-color: var(--border-color) !important;
}

/* Red/Error states */
.bg-red-50 {
  background: rgba(239, 68, 68, 0.1) !important;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.border-red-200 {
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.text-red-900 {
  color: #dc2626 !important;
}

.bg-red-600 {
  background: #dc2626 !important;
}

.bg-red-600:hover {
  background: #b91c1c !important;
}

/* Loading spinner */
.border-blue-600 {
  border-color: var(--color-primary, #10b981) !important;
}

/* Emoticons styles */
.visio-header-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.status-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.btn-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.waiting-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.finished-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.recording-icon {
  font-size: 1rem;
  line-height: 1;
}

.presentiel-icon {
  font-size: 2rem;
  line-height: 1;
}

/* Animation pour le loading */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Rounded corners */
.rounded-lg {
  border-radius: 1rem;
}

.rounded-full {
  border-radius: 9999px;
}

/* Responsive */
@media (max-width: 768px) {
  .seance-details {
    padding: 1rem;
  }

  .seance-details > div {
    padding: 1rem;
  }
}
</style>
