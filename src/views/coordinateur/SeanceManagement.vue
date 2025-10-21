<template>
  <div class="seance-management">
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Gestion des Séances & Visioconférence</h1>
      <p class="text-gray-600 mt-1">Activez ou désactivez la visioconférence pour chaque séance</p>
    </div>

    <!-- Filtres -->
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Période
          </label>
          <select
            v-model="filters.days"
            @change="loadSeances"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option :value="7">7 prochains jours</option>
            <option :value="14">14 prochains jours</option>
            <option :value="30">30 prochains jours</option>
            <option :value="60">60 prochains jours</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Enseignant
          </label>
          <select
            v-model="filters.teacher_id"
            @change="loadSeances"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">Tous les enseignants</option>
            <option v-for="enseignant in enseignants" :key="enseignant.id" :value="enseignant.id">
              {{ enseignant.nom }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Classe
          </label>
          <select
            v-model="filters.classe_id"
            @change="loadSeances"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">Toutes les classes</option>
            <option v-for="classe in classes" :key="classe.id" :value="classe.id">
              {{ classe.nom }} - {{ classe.filiere?.nom }} {{ classe.niveau?.nom }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Chargement des séances...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-900 font-medium">{{ error }}</p>
      <button
        @click="loadSeances"
        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        Réessayer
      </button>
    </div>

    <!-- Séances List -->
    <div v-else-if="seances && seances.length > 0" class="space-y-4">
      <div
        v-for="seance in seances"
        :key="seance.id"
        class="bg-white shadow rounded-lg p-6"
      >
        <div class="flex justify-between items-start">
          <!-- Infos séance -->
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ seance.matiere?.libelle || seance.matiere?.nom || 'Matière non définie' }}
            </h3>

            <div class="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-gray-600 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Date
                </p>
                <p class="font-medium">{{ formatDate(seance.programmation?.date) }}</p>
              </div>
              <div>
                <p class="text-gray-600 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Horaire
                </p>
                <p class="font-medium">{{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}</p>
              </div>
              <div>
                <p class="text-gray-600 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  Classe
                </p>
                <p class="font-medium">{{ seance.classe?.libelle || seance.classe?.nom || 'Non assignée' }}</p>
              </div>
              <div>
                <p class="text-gray-600 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Salle
                </p>
                <p class="font-medium">{{ seance.salle || 'Non spécifiée' }}</p>
              </div>
            </div>
          </div>

          <!-- Toggle Visio -->
          <div class="ml-6 flex-shrink-0">
            <button
              @click="toggleSeanceVisio(seance)"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition flex items-center gap-2',
                seance.visio_enabled
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
              <span v-if="seance.visio_enabled">Visio activée</span>
              <span v-else>Activer visio</span>
            </button>
          </div>
        </div>

        <!-- Options visio -->
        <div
          v-if="seance.visio_enabled"
          class="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              </div>
              <div>
                <p class="font-semibold text-green-900">Visioconférence Jitsi programmée</p>
                <p class="text-sm text-green-700 mt-1 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Salle: <span class="font-mono bg-green-100 px-2 py-0.5 rounded">{{ seance.visio_room_id }}</span>
                </p>
                <p class="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Accès possible 15 minutes avant le cours
                </p>
              </div>
            </div>

            <div class="flex-shrink-0">
              <a
                :href="`https://meet.jit.si/${seance.visio_room_id}`"
                target="_blank"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Ouvrir Jitsi
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white shadow rounded-lg p-12 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="mt-4 text-gray-600">Aucune séance trouvée pour la période sélectionnée</p>
    </div>

    <!-- Stats -->
    <div v-if="seances && seances.length > 0" class="mt-6 grid grid-cols-3 gap-4">
      <div class="bg-white shadow rounded-lg p-4">
        <p class="text-sm text-gray-600">Total séances</p>
        <p class="text-2xl font-bold text-gray-900">{{ seances.length }}</p>
      </div>
      <div class="bg-white shadow rounded-lg p-4">
        <p class="text-sm text-purple-600">Visio activées</p>
        <p class="text-2xl font-bold text-purple-900">
          {{ seances.filter(s => s.visio_enabled).length }}
        </p>
      </div>
      <div class="bg-white shadow rounded-lg p-4">
        <p class="text-sm text-gray-600">Taux visio</p>
        <p class="text-2xl font-bold text-gray-900">
          {{ Math.round((seances.filter(s => s.visio_enabled).length / seances.length) * 100) }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import lmsService from '@/services/lms'

export default {
  name: 'SeanceManagement',

  data() {
    return {
      loading: false,
      error: null,
      seances: [],
      classes: [],
      enseignants: [],
      filters: {
        days: 30,
        teacher_id: null,
        classe_id: null
      }
    }
  },

  computed: {
    stats() {
      const total = this.seances.length
      const visioActivees = this.seances.filter(s => s.visio_enabled).length
      const taux = total > 0 ? ((visioActivees / total) * 100).toFixed(1) : 0

      return {
        total,
        visioActivees,
        taux
      }
    }
  },

  mounted() {
    this.loadClasses()
    this.loadEnseignants()
    this.loadSeances()
  },

  methods: {
    formatTime(isoTimestamp) {
      if (!isoTimestamp) return 'N/A'
      return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    async loadClasses() {
      try {
        console.log('📚 Chargement classes...')
        const response = await lmsService.getClasses()

        if (response && response.success) {
          this.classes = response.data || []
          console.log(`✅ ${this.classes.length} classes chargées`)
        }
      } catch (error) {
        console.error('❌ Erreur chargement classes:', error)
      }
    },

    async loadEnseignants() {
      try {
        console.log('👨‍🏫 Chargement enseignants...')
        const response = await lmsService.getEnseignants()

        if (response && response.success) {
          this.enseignants = response.data || []
          console.log(`✅ ${this.enseignants.length} enseignants chargés`)
        }
      } catch (error) {
        console.error('❌ Erreur chargement enseignants:', error)
      }
    },

    async loadSeances() {
      this.loading = true
      this.error = null

      try {
        console.log('📅 Chargement séances à venir...')

        const params = {}
        if (this.filters.days) params.days = this.filters.days
        if (this.filters.teacher_id) params.teacher_id = this.filters.teacher_id
        if (this.filters.classe_id) params.classe_id = this.filters.classe_id

        const data = await lmsService.getUpcomingSeances(params)

        console.log('✅ Séances reçues:', data)

        if (data.success) {
          // Backend retourne data.data (tableau direct), pas data.data.seances
          this.seances = Array.isArray(data.data) ? data.data : (data.data.seances || [])
          console.log(`📊 ${this.seances.length} séances chargées`)
          console.log('🔍 Première séance:', this.seances[0])
        } else {
          this.error = 'Erreur lors du chargement des séances'
        }
      } catch (error) {
        console.error('❌ Erreur chargement séances:', error)
        this.error = 'Erreur lors du chargement des séances'
      } finally {
        this.loading = false
      }
    },

    async toggleSeanceVisio(seance) {
      const newState = !seance.visio_enabled

      try {
        console.log(`🔄 Toggle visio séance ${seance.id}: ${newState ? 'ON' : 'OFF'}`)

        const response = await lmsService.toggleVisio(
          seance.id,
          newState,
          seance.visio_type || 'jitsi'
        )

        console.log('✅ Réponse toggle:', response)

        if (response.success) {
          // Mettre à jour localement
          seance.visio_enabled = newState
          if (!newState) {
            seance.visio_type = null
            seance.visio_room_id = null
          } else {
            seance.visio_room_id = `seance_${seance.id}`
          }

          this.$toast?.success(response.message || 'Visioconférence mise à jour')
        } else {
          this.$toast?.error('Erreur lors de la mise à jour')
        }
      } catch (error) {
        console.error('❌ Erreur toggle visio:', error)
        this.$toast?.error('Erreur lors de l\'activation/désactivation de la visio')
      }
    },

    async updateVisioType(seance) {
      try {
        console.log(`🔄 Update type visio séance ${seance.id}: ${seance.visio_type}`)

        const response = await lmsService.toggleVisio(
          seance.id,
          true,
          seance.visio_type
        )

        if (response.success) {
          this.$toast?.success('Type de visio mis à jour')
        }
      } catch (error) {
        console.error('❌ Erreur update visio type:', error)
        this.$toast?.error('Erreur lors de la mise à jour du type de visio')
      }
    },

    applyFilters() {
      console.log('🔍 Application des filtres:', this.filters)
      this.loadSeances()
    },

    formatDate(date) {
      if (!date) return 'Non défini'
      return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.seance-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
