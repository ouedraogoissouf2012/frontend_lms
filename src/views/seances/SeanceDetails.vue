<template>
  <div class="seance-details">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Chargement...</p>
    </div>

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
                  {{ seance.enseignant?.nom || 'Non assigné' }}
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
        </div>
      </div>

      <!-- Visioconférence Section -->
      <div v-if="visio && visio.enabled" class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span class="visio-header-icon">◉</span> Visioconférence {{ visio.type }}
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
              <span class="status-icon">⏰</span> La visio ouvrira 15 minutes avant le cours
            </span>
            <span v-else-if="visio.window.is_in_window">
              <span class="status-icon">✓</span> Fenêtre visio active
            </span>
            <span v-else>
              <span class="status-icon">■</span> Fenêtre visio fermée
            </span>
          </p>
        </div>

        <!-- Bouton Enseignant -->
        <div v-if="isTeacher">
          <button
            v-if="visio.window?.can_start"
            @click="startVisio"
            class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            <span class="btn-icon">▶</span> Démarrer le cours
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

        <!-- Bouton Étudiant -->
        <div v-else-if="isStudent">
          <div v-if="!visio.window?.has_started" class="text-center py-6">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
              <span class="waiting-icon">⏰</span> En attente de l'enseignant
            </div>
            <p class="mt-2 text-sm text-gray-600">
              Le cours commencera à {{ seance.heure_debut }}
            </p>
          </div>

          <div v-else-if="roomActive && visio.window?.is_in_window">
            <button
              @click="joinVisio"
              :disabled="joiningVisio"
              class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span v-if="!joiningVisio"><span class="btn-icon">◉</span> Rejoindre le cours</span>
              <span v-else><span class="waiting-icon">⏰</span> Validation en cours...</span>
            </button>
          </div>

          <div v-else-if="visio.window?.has_ended" class="text-center py-6">
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
              <span class="finished-icon">✓</span> Cours terminé
            </div>
            <p v-if="visio.recording_url" class="mt-4">
              <a
                :href="visio.recording_url"
                target="_blank"
                class="text-blue-600 hover:underline"
              >
                <span class="recording-icon">▶</span> Voir l'enregistrement
              </a>
            </p>
          </div>

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
          <span class="presentiel-icon">◈</span>
          <div>
            <p class="font-semibold">Cours en présentiel</p>
            <p class="text-sm text-gray-600">Salle: {{ seance.salle || 'À définir' }}</p>
          </div>
        </div>
      </div>

      <!-- Participants -->
      <div class="bg-white shadow rounded-lg p-6">
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
</template>

<script>
import lmsService from '@/services/lms'
import { auth } from '@/services/api'

export default {
  name: 'SeanceDetails',

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
      joiningVisio: false
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
      return this.user && ['enseignant', 'coordinateur'].includes(this.user.role)
    },

    isStudent() {
      return this.user && this.user.role === 'étudiant'
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
        console.log('📅 Chargement détails séance:', this.seanceId)

        const data = await lmsService.getSeanceDetails(this.seanceId)

        console.log('✅ Données séance reçues:', data)

        if (data.success) {
          this.seance = data.data.seance
          this.visio = data.data.visio
          this.participants = data.data.participants

          // Vérifier si la room est active via le statut fenêtre
          this.roomActive = this.visio?.window?.is_in_window || false

          console.log('📹 Visio:', this.visio?.enabled ? 'Activée' : 'Désactivée')
          console.log('⏰ Fenêtre active:', this.roomActive)
        } else {
          this.error = 'Séance non trouvée'
        }
      } catch (error) {
        console.error('❌ Erreur chargement séance:', error)
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

        console.log('✅ Visio démarrée:', result)

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

      this.joiningVisio = true

      try {
        console.log('👨‍🎓 Étudiant rejoint la visio...')

        // 1. Valider l'accès
        const validation = await lmsService.validateParticipant(
          this.seanceId,
          this.user.id
        )

        console.log('✅ Validation:', validation)

        if (!validation.authorized) {
          alert(`Accès refusé: ${validation.reason}`)
          return
        }

        // 2. Générer lien Jitsi participant (sans modération)
        const roomName = this.visio.room_id || `seance_${this.seanceId}`
        const displayName = encodeURIComponent(this.user.name)
        const link = `https://meet.jit.si/${roomName}#userInfo.displayName=${displayName}`

        console.log('🔗 Lien Jitsi:', link)

        // 3. Ouvrir Jitsi
        window.open(link, '_blank')
      } catch (error) {
        console.error('❌ Erreur rejoindre visio:', error)
        alert('Erreur lors de la connexion à la visioconférence')
      } finally {
        this.joiningVisio = false
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
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
</style>
