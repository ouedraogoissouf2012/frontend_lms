<template>
  <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50" @click.self="close">
    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Left: Titre et enseignant -->
          <div>
            <h3 class="text-xl font-bold flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Liste de Présence
            </h3>
            <p v-if="teacher && teacher.nom" class="text-sm font-normal opacity-90 mt-1">
              Enseignant: {{ teacher.prenom ? teacher.prenom + ' ' : '' }}{{ teacher.nom }}
            </p>
          </div>

          <!-- Center: Durée de la séance -->
          <div class="text-center flex-1">
            <p class="text-sm opacity-90">Séance</p>
            <p class="text-lg font-semibold mt-1">
              <i class="fa fa-clock-o mr-2"></i>{{ seanceTime }}
            </p>
            <p class="text-2xl font-bold mt-1">({{ seanceDuration }})</p>
          </div>

          <!-- Right: Coordinateur et bouton fermer -->
          <div class="text-right flex items-start gap-4">
            <div v-if="coordinator && coordinator.nom">
              <p class="text-sm font-normal opacity-90">Coordinateur:</p>
              <p class="text-sm font-semibold">{{ coordinator.prenom ? coordinator.prenom + ' ' : '' }}{{ coordinator.nom }}</p>
            </div>
            <button @click="close" class="text-white hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p class="font-medium">Erreur lors du chargement des participants</p>
          <p class="text-sm mt-1">{{ error }}</p>
        </div>

        <!-- Liste de présence chargée -->
        <div v-else>
          <!-- Boutons d'export -->
          <div class="flex justify-end gap-3 mb-6">
            <button
              @click="exportPDF"
              :disabled="exporting"
              class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {{ exporting ? 'Export...' : 'Exporter PDF' }}
            </button>
            <button
              @click="exportExcel"
              :disabled="exporting"
              class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ exporting ? 'Export...' : 'Exporter Excel' }}
            </button>
          </div>

          <!-- Statistiques -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <!-- Total étudiants -->
            <div class="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-blue-600 font-medium">Total</p>
                  <p class="text-2xl font-bold text-blue-900">{{ stats.total_students }}</p>
                </div>
                <svg class="w-10 h-10 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>

            <!-- Présents -->
            <div class="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-green-600 font-medium">Présents</p>
                  <p class="text-2xl font-bold text-green-900">{{ stats.present_count }}</p>
                  <p v-if="stats.visio_status === 'terminee'" class="text-xs text-green-600 mt-1">{{ stats.presence_rate }}%</p>
                  <p v-else class="text-xs text-green-500 mt-1 italic">En cours...</p>
                </div>
                <svg class="w-10 h-10 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <!-- Absents -->
            <div class="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-red-600 font-medium">Absents</p>
                  <p class="text-2xl font-bold text-red-900">{{ stats.absent_count }}</p>
                </div>
                <svg class="w-10 h-10 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <!-- Retards -->
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-orange-600 font-medium">Retards</p>
                  <p class="text-2xl font-bold text-orange-900">{{ stats.late_count }}</p>
                </div>
                <svg class="w-10 h-10 text-orange-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <!-- Durée moyenne -->
            <div class="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-purple-600 font-medium">Durée moy.</p>
                  <p class="text-2xl font-bold text-purple-900">{{ formatDuration(stats.average_duration_minutes) }}</p>
                  <p v-if="stats.visio_status === 'terminee'" class="text-xs text-purple-600 mt-1">{{ stats.average_percentage }}%</p>
                  <p v-else class="text-xs text-purple-500 mt-1 italic">En cours...</p>
                </div>
                <svg class="w-10 h-10 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Tableau des étudiants -->
          <div class="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <!-- En-tête du tableau -->
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-100">
                  <tr>
                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      NOM
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      STATUT
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      DURÉE
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      REJOINT
                    </th>
                    <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      QUITTÉ
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr
                    v-for="student in students"
                    :key="student.user_id"
                    :class="[
                      student.is_present ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100',
                      'transition-colors duration-150'
                    ]"
                  >
                    <!-- NOM -->
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0">
                          <div :class="[
                            'h-10 w-10 rounded-full flex items-center justify-center text-white font-bold',
                            student.is_present ? 'bg-green-600' : 'bg-red-600'
                          ]">
                            {{ getInitials(student.nom + ' ' + student.prenom) }}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="font-medium text-gray-900">{{ student.nom }} {{ student.prenom }}</div>
                          <div class="text-gray-500 text-xs">{{ student.email }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- STATUT -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm">
                      <div class="flex items-center">
                        <span class="text-lg mr-2">{{ student.status_icon }}</span>
                        <div>
                          <div class="font-medium text-gray-900">{{ student.status }}</div>
                          <div v-if="stats.visio_status === 'terminee' && student.percentage > 0" class="text-xs text-gray-500">
                            {{ student.percentage }}% de présence
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- DURÉE -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
                      <div v-if="student.is_present" class="font-medium text-gray-900">
                        {{ student.duration_formatted }}
                      </div>
                      <div v-else class="text-gray-400">-</div>
                    </td>

                    <!-- REJOINT -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
                      <div v-if="student.joined_at" class="font-medium text-gray-900">
                        {{ student.joined_at }}
                      </div>
                      <div v-else class="text-gray-400">-</div>
                    </td>

                    <!-- QUITTÉ -->
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
                      <div v-if="student.left_at === 'En cours'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <span class="relative flex h-2 w-2 mr-1.5">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        En cours
                      </div>
                      <div v-else-if="student.left_at" class="font-medium text-gray-900">
                        {{ student.left_at }}
                      </div>
                      <div v-else class="text-gray-400">-</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Aucun étudiant -->
            <div v-if="students.length === 0" class="text-center py-12 bg-gray-50">
              <svg class="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p class="text-gray-600 font-medium text-lg">Aucun étudiant dans cette classe</p>
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
import { useAuthStore } from '@/stores/auth'

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
      students: [],
      teacher: null,
      coordinator: null,
      seanceStartTime: null,
      seanceEndTime: null,
      stats: {
        total_students: 0,
        present_count: 0,
        absent_count: 0,
        presence_rate: 0,
        complete_presence_count: 0,
        late_count: 0,
        left_early_count: 0,
        average_percentage: 0,
        average_duration_minutes: 0,
        seance_duration_minutes: 120
      },
      refreshInterval: null,
      exporting: false
    }
  },
  computed: {
    seanceDuration() {
      const minutes = Math.round(this.stats.seance_duration_minutes) // Arrondir les minutes
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
      }
      return `${minutes} min`
    },
    seanceTime() {
      if (this.seanceStartTime && this.seanceEndTime) {
        return `${this.seanceStartTime} - ${this.seanceEndTime}`
      }
      return null
    }
  },
  mounted() {
    this.loadParticipants()
    // Auto-refresh toutes les 15 secondes (silencieux)
    this.refreshInterval = setInterval(() => {
      this.loadParticipants(true) // silent refresh
    }, 15000)
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },
  methods: {
    async loadParticipants(silent = false) {
      // Ne pas afficher le spinner sur les refreshs automatiques
      if (!silent) {
        this.loading = true
      }
      this.error = null

      try {
        console.log('[ParticipantsModal] Chargement liste de présence pour séance:', this.seanceId)

        // Récupérer la liste unifiée (tous les étudiants avec statut présent/absent)
        const response = await lmsService.getVisioParticipants(this.seanceId)

        console.log('[ParticipantsModal] Réponse:', response)

        if (response && response.success) {
          this.students = response.data.students || []
          this.stats = response.data.statistics || this.stats
          this.teacher = response.data.teacher || null
          this.coordinator = response.data.coordinator || null

          // Extraire les horaires de la séance si disponibles
          if (response.data.seance_info) {
            this.seanceStartTime = response.data.seance_info.heure_debut
            this.seanceEndTime = response.data.seance_info.heure_fin
          }

          console.log('[ParticipantsModal] Liste de présence chargée:', {
            students: this.students.length,
            stats: this.stats,
            teacher: this.teacher,
            coordinator: this.coordinator,
            seanceTime: this.seanceTime
          })
        } else {
          throw new Error(response?.message || 'Erreur lors du chargement de la liste de présence')
        }
      } catch (error) {
        console.error('[ParticipantsModal] Erreur chargement liste de présence:', error)
        this.error = error.response?.data?.message || error.message || 'Erreur inconnue'
      } finally {
        this.loading = false
      }
    },

    /**
     * Formater une durée en minutes vers format lisible
     */
    formatDuration(minutes) {
      if (!minutes || minutes === 0) return '-'

      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60

      if (hours > 0) {
        return `${hours}h${mins.toString().padStart(2, '0')}`
      }
      return `${mins}min`
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

    /**
     * Exporter la liste de présence en PDF
     */
    async exportPDF() {
      if (this.exporting) return

      this.exporting = true
      try {
        console.log('[ParticipantsModal] Export PDF de la séance', this.seanceId)

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        const token = useAuthStore().token

        // Créer l'URL de téléchargement
        const url = `${API_URL}/lms/seances/${this.seanceId}/export/presences/pdf`

        // Télécharger le fichier
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          }
        })

        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement du PDF')
        }

        // Créer un blob et télécharger
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `presences_seance_${this.seanceId}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)

        console.log('[ParticipantsModal] ✅ PDF téléchargé avec succès')
      } catch (error) {
        console.error('[ParticipantsModal] Erreur export PDF:', error)
        alert('Erreur lors de l\'export PDF : ' + error.message)
      } finally {
        this.exporting = false
      }
    },

    /**
     * Exporter la liste de présence en Excel
     */
    async exportExcel() {
      if (this.exporting) return

      this.exporting = true
      try {
        console.log('[ParticipantsModal] Export Excel de la séance', this.seanceId)

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        const token = useAuthStore().token

        // Créer l'URL de téléchargement
        const url = `${API_URL}/lms/seances/${this.seanceId}/export/presences/excel`

        // Télécharger le fichier
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        })

        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement du fichier Excel')
        }

        // Créer un blob et télécharger
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `presences_seance_${this.seanceId}_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)

        console.log('[ParticipantsModal] ✅ Excel téléchargé avec succès')
      } catch (error) {
        console.error('[ParticipantsModal] Erreur export Excel:', error)
        alert('Erreur lors de l\'export Excel : ' + error.message)
      } finally {
        this.exporting = false
      }
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
