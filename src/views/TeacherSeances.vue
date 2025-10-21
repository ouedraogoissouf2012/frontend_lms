<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8 flex items-center gap-4">
        <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Mes Séances</h1>
          <p class="text-gray-600 mt-1">Gérez vos cours et visioconférences</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Chargement de vos séances...</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        {{ error }}
      </div>

      <!-- Séances List -->
      <div v-if="!loading && seances.length > 0" class="space-y-4">
        <div
          v-for="seance in seances"
          :key="seance.id"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <!-- Header Séance -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900">
                {{ seance.matiere?.nom || 'Matière non définie' }}
              </h3>
              <p v-if="seance.matiere?.code" class="text-sm text-gray-500 mt-1">
                Code: {{ seance.matiere.code }}
              </p>
            </div>

            <!-- Badge Status Visio -->
            <div v-if="seance.visio" class="ml-4">
              <span
                v-if="seance.visio.status === 'programmee'"
                class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full"
              >
                Visio Programmée
              </span>
              <span
                v-else-if="seance.visio.status === 'active'"
                class="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center gap-1"
              >
                <svg class="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3"/>
                </svg>
                EN DIRECT
              </span>
              <span
                v-else-if="seance.visio.status === 'terminee'"
                class="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full"
              >
                Terminée
              </span>
            </div>
          </div>

          <!-- Infos Séance -->
          <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-gray-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Date
              </p>
              <p class="font-semibold">{{ formatDate(seance.programmation?.date) }}</p>
            </div>

            <div>
              <p class="text-gray-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Horaire
              </p>
              <p class="font-semibold">{{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}</p>
            </div>

            <div>
              <p class="text-gray-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                Classe
              </p>
              <p class="font-semibold">{{ seance.classe?.nom || 'N/A' }}</p>
            </div>

            <div>
              <p class="text-gray-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Salle
              </p>
              <p class="font-semibold">{{ seance.salle || 'N/A' }}</p>
            </div>
          </div>

          <!-- Actions Visio -->
          <div class="mt-6 border-t pt-4">
            <!-- Pas de visio activée -->
            <div v-if="!seance.visio || !seance.visio.enabled" class="flex items-center justify-between">
              <p class="text-gray-600 text-sm">Aucune visioconférence programmée</p>
              <button
                @click="handleActivateVisio(seance)"
                :disabled="actionLoading === seance.id"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
                {{ actionLoading === seance.id ? 'Activation...' : 'Activer la visio' }}
              </button>
            </div>

            <!-- Visio programmée -->
            <div v-else-if="seance.visio.status === 'programmee'" class="space-y-3">
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold text-blue-900">Visioconférence Jitsi programmée</p>
                    <p class="text-sm text-blue-700 mt-1">
                      Salle: <span class="font-mono bg-blue-100 px-2 py-0.5 rounded">{{ seance.visio.room_id }}</span>
                    </p>
                  </div>
                  <button
                    @click="handleStartVisio(seance)"
                    :disabled="actionLoading === seance.id"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ actionLoading === seance.id ? 'Démarrage...' : 'Démarrer maintenant' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Visio active -->
            <div v-else-if="seance.visio.status === 'active'" class="space-y-3">
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="font-semibold text-green-900 flex items-center gap-2">
                      <svg class="w-5 h-5 text-green-600 animate-pulse" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3"/>
                      </svg>
                      Cours EN DIRECT
                    </p>
                    <p class="text-sm text-green-700 mt-1">
                      Démarré à {{ formatTime(seance.visio.started_at) }}
                    </p>
                    <p v-if="seance.visio.participants_count > 0" class="text-sm text-green-700 mt-1 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                      {{ seance.visio.participants_count }} participant(s) connecté(s)
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <a
                      :href="`https://meet.jit.si/${seance.visio.room_id}`"
                      target="_blank"
                      class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                      </svg>
                      Rejoindre
                    </a>
                    <button
                      @click="handleEndVisio(seance)"
                      :disabled="actionLoading === seance.id"
                      class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                      </svg>
                      {{ actionLoading === seance.id ? 'Arrêt...' : 'Terminer' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visio terminée -->
            <div v-else-if="seance.visio.status === 'terminee'" class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-gray-900">Visioconférence terminée</p>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ seance.visio.participants_count }} participant(s) ont rejoint
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && seances.length === 0" class="text-center py-12">
        <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p class="text-gray-600 text-lg">Aucune séance programmée</p>
        <p class="text-gray-500 text-sm mt-2">Vos prochaines séances apparaîtront ici</p>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '../components/Navbar.vue'
import { lmsService } from '../services/lms'

export default {
  name: 'TeacherSeances',
  components: {
    Navbar
  },
  data() {
    return {
      seances: [],
      loading: true,
      error: null,
      actionLoading: null // ID de la séance en cours d'action
    }
  },
  mounted() {
    this.loadSeances()
  },
  methods: {
    async loadSeances() {
      this.loading = true
      this.error = null

      try {
        console.log('Chargement séances enseignant...')
        const response = await lmsService.getMyTeachingSeances()

        console.log('Réponse séances:', response)
        this.seances = response.data || []
        console.log(`${this.seances.length} séance(s) chargée(s)`)
      } catch (error) {
        console.error('Erreur chargement séances:', error)
        this.error = 'Erreur lors du chargement des séances'
      } finally {
        this.loading = false
      }
    },

    async handleActivateVisio(seance) {
      if (this.actionLoading) return

      this.actionLoading = seance.id

      try {
        console.log('Activation visio pour séance:', seance.id)
        const response = await lmsService.activateVisio(seance.id)

        console.log('Visio activée:', response)

        // Recharger les séances pour avoir les données à jour
        await this.loadSeances()
      } catch (error) {
        console.error('Erreur activation visio:', error)
        this.error = 'Erreur lors de l\'activation de la visio'
      } finally {
        this.actionLoading = null
      }
    },

    async handleStartVisio(seance) {
      if (this.actionLoading) return

      this.actionLoading = seance.id

      try {
        console.log('Démarrage visio pour séance:', seance.id)
        const response = await lmsService.startVisio(seance.id)

        console.log('Visio démarrée:', response)

        // Recharger pour mettre à jour le statut
        await this.loadSeances()
      } catch (error) {
        console.error('Erreur démarrage visio:', error)
        this.error = 'Erreur lors du démarrage de la visio'
      } finally {
        this.actionLoading = null
      }
    },

    async handleEndVisio(seance) {
      if (this.actionLoading) return

      if (!confirm('Voulez-vous vraiment terminer cette visioconférence ?')) {
        return
      }

      this.actionLoading = seance.id

      try {
        console.log('Fin visio pour séance:', seance.id)
        const response = await lmsService.endVisio(seance.id)

        console.log('Visio terminée:', response)

        // Recharger pour mettre à jour le statut
        await this.loadSeances()
      } catch (error) {
        console.error('Erreur fin visio:', error)
        this.error = 'Erreur lors de la terminaison de la visio'
      } finally {
        this.actionLoading = null
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A'
      const date = new Date(dateStr)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    },

    formatTime(dateTimeStr) {
      if (!dateTimeStr) return 'N/A'
      const date = new Date(dateTimeStr)
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>
