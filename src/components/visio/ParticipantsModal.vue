<template>
  <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4 flex items-center justify-between">
        <h3 class="text-xl font-bold flex items-center">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Participants autorisés
        </h3>
        <button @click="close" class="text-white hover:text-gray-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p class="font-medium">Erreur lors du chargement des participants</p>
          <p class="text-sm mt-1">{{ error }}</p>
        </div>

        <!-- Participants loaded -->
        <div v-else>
          <!-- Statistiques -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-blue-600 font-medium">Enseignant</p>
                  <p class="text-2xl font-bold text-blue-900">1</p>
                </div>
                <svg class="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
            </div>

            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-green-600 font-medium">Étudiants</p>
                  <p class="text-2xl font-bold text-green-900">{{ participants?.students?.length || 0 }}</p>
                </div>
                <svg class="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Enseignant Section -->
          <div class="mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
              Enseignant
            </h4>

            <div v-if="participants?.teacher" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {{ getInitials(participants.teacher.name) }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{{ participants.teacher.name }}</p>
                    <p class="text-sm text-gray-600">{{ participants.teacher.email }}</p>
                    <p class="text-xs text-blue-600 mt-1">ID: {{ participants.teacher.id }}</p>
                  </div>
                </div>

                <div class="flex items-center">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Responsable
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Étudiants Section -->
          <div>
            <h4 class="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Étudiants inscrits
              </span>
              <span class="text-sm font-normal text-gray-500">
                {{ participants?.students?.length || 0 }} étudiant(s)
              </span>
            </h4>

            <!-- Liste des étudiants -->
            <div v-if="participants?.students && participants.students.length > 0" class="space-y-2">
              <div
                v-for="(student, index) in participants.students"
                :key="student.id"
                class="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-150"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {{ getInitials(student.name) }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ student.name }}</p>
                      <p class="text-xs text-gray-600">{{ student.email }}</p>
                      <p class="text-xs text-gray-500 mt-0.5">Matricule: {{ student.matricule || 'N/A' }}</p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2">
                    <!-- Badge numéro -->
                    <span class="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
                      {{ index + 1 }}
                    </span>

                    <!-- Status online/offline (si disponible) -->
                    <span
                      v-if="student.online"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      <span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      En ligne
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Aucun étudiant -->
            <div v-else class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p class="text-gray-600 font-medium">Aucun étudiant inscrit</p>
              <p class="text-gray-500 text-sm mt-1">Contactez le coordinateur pour inscrire des étudiants à cette séance</p>
            </div>
          </div>

          <!-- Total -->
          <div class="mt-6 pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-gray-700">Total des participants autorisés:</span>
              <span class="text-lg font-bold text-purple-600">{{ participants?.total || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
        <button
          @click="close"
          class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import lmsService from '@/services/lms'

export default {
  name: 'ParticipantsModal',
  props: {
    seanceId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      participants: null
    }
  },
  mounted() {
    this.loadParticipants()
  },
  methods: {
    async loadParticipants() {
      this.loading = true
      this.error = null

      try {
        console.log('[ParticipantsModal] Chargement participants pour séance:', this.seanceId)

        const response = await lmsService.getSeanceParticipants(this.seanceId)

        console.log('[ParticipantsModal] Réponse:', response)

        if (response && response.success) {
          this.participants = response.data
          console.log('[ParticipantsModal] Participants chargés:', this.participants)
        } else {
          throw new Error(response?.message || 'Erreur lors du chargement des participants')
        }
      } catch (error) {
        console.error('[ParticipantsModal] Erreur chargement participants:', error)
        this.error = error.response?.data?.message || error.message || 'Erreur inconnue'
      } finally {
        this.loading = false
      }
    },

    /**
     * Obtenir les initiales d'un nom
     * Ex: "Jean Dupont" -> "JD"
     */
    getInitials(name) {
      if (!name) return '?'

      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    },

    close() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
/* Modal animations */
.fixed {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
