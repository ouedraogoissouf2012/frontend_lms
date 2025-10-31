<template>
  <DashboardLayout>
    <div class="classe-details">
      <!-- Header avec nom de la classe -->
      <div class="header-card">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <!-- Breadcrumb -->
          <div class="breadcrumb">
            <button @click="$router.back()" class="breadcrumb-link">
              Dashboard
            </button>
            <span>›</span>
            <span class="breadcrumb-current">Gestion de la Classe</span>
          </div>

          <!-- Nom de la classe -->
          <h1 class="page-title">
            {{ classe?.nom || 'Chargement...' }}
          </h1>

          <!-- Infos classe -->
          <div class="classe-info-line">
            <span v-if="classe?.filiere" class="info-item">
              <span class="info-icon">⌂</span>
              Filière: <strong>{{ classe.filiere.nom }}</strong>
            </span>
            <span v-if="classe?.niveau" class="info-item">
              <span class="info-icon">☰</span>
              Niveau: <strong>{{ classe.niveau.nom }}</strong>
            </span>
            <span v-if="classe?.code" class="info-item">
              <span class="info-icon">#</span>
              Code: <strong>{{ classe.code }}</strong>
            </span>
          </div>
        </div>

        <button @click="$router.back()" class="btn-retour">
          ← Retour
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-grid-header" v-if="!loading">
        <div class="stat-card-header">
          <div class="stat-header-inner">
            <span class="stat-icon-header">☺</span>
            <span class="stat-label-header">Étudiants</span>
          </div>
          <p class="stat-value-header">{{ etudiants?.length || 0 }}</p>
        </div>
        <div class="stat-card-header">
          <div class="stat-header-inner">
            <span class="stat-icon-header">☷</span>
            <span class="stat-label-header">Matières</span>
          </div>
          <p class="stat-value-header">{{ matieres?.length || 0 }}</p>
        </div>
        <div class="stat-card-header">
          <div class="stat-header-inner">
            <span class="stat-icon-header">✓</span>
            <span class="stat-label-header">Évaluations</span>
          </div>
          <p class="stat-value-header">{{ evaluations?.length || 0 }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p class="mt-4 text-gray-600">Chargement...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-900 font-medium">{{ error }}</p>
      <button
        @click="loadClasseDetails"
        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        Réessayer
      </button>
    </div>

    <!-- Tabs -->
    <div v-else class="tabs-container">
      <!-- Tab Headers -->
      <div class="tabs-header">
        <nav class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-6 py-4 font-medium text-sm border-b-2 transition',
              activeTab === tab.id
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              :class="[
                'ml-2 px-2 py-1 rounded-full text-xs',
                activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              ]"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Onglet Matières -->
        <div v-if="activeTab === 'matieres'">
          <div v-if="matieres && matieres.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coefficient</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignants</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="matiere in matieres" :key="matiere.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ matiere.nom }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{{ matiere.code }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {{ matiere.coefficient }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900" v-if="matiere.enseignants && matiere.enseignants.length > 0">
                      <div v-for="(ens, idx) in matiere.enseignants" :key="idx" class="flex items-center gap-1">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {{ ens.nom }}
                      </div>
                    </div>
                    <span v-else class="text-sm text-gray-400">Non assigné</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      @click="viewMatiere(matiere.id)"
                      class="text-green-600 hover:text-green-900"
                    >
                      Voir détails →
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-12 text-gray-500">
            <p>Aucune matière disponible pour cette classe</p>
          </div>
        </div>

        <!-- Onglet Étudiants -->
        <div v-if="activeTab === 'etudiants'">
          <div v-if="etudiants && etudiants.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="etudiant in etudiants" :key="etudiant.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ etudiant.matricule }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ etudiant.nom }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ etudiant.email }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                      etudiant.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    ]">
                      {{ etudiant.statut || 'Actif' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-12 text-gray-500">
            <p>Aucun étudiant inscrit dans cette classe</p>
          </div>
        </div>

        <!-- Onglet Évaluations -->
        <div v-if="activeTab === 'evaluations'">
          <div v-if="evaluations && evaluations.length > 0" class="space-y-4">
            <div
              v-for="evaluation in evaluations"
              :key="evaluation.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              @click="viewEvaluation(evaluation.id)"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900">{{ evaluation.titre }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ evaluation.matiere?.nom }}</p>

                  <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ formatDate(evaluation.programmation?.date_evaluation) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ evaluation.duree_minutes }} min
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Coef: {{ evaluation.programmation?.coefficient || 1 }}
                    </span>
                  </div>

                  <!-- Fenêtre temporelle -->
                  <div v-if="evaluation.programmation?.window" class="mt-2">
                    <span :class="[
                      'px-2 py-1 text-xs rounded',
                      getEvaluationStatusClass(evaluation.programmation.window)
                    ]">
                      {{ getEvaluationStatusLabel(evaluation.programmation.window) }}
                    </span>
                  </div>
                </div>

                <button class="text-green-600 hover:text-green-800">
                  →
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12 text-gray-500">
            <p>Aucune évaluation programmée pour cette classe</p>
          </div>
        </div>

        <!-- Onglet Planning -->
        <div v-if="activeTab === 'planning'">
          <div v-if="emploiTemps && emploiTemps.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jour</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horaires</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignant</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salle</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(seance, idx) in emploiTemps" :key="idx" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ seance.jour }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ seance.matiere?.nom || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ seance.enseignant?.nom || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ seance.salle || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                      seance.type === 'cours' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    ]">
                      {{ seance.type || 'cours' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-12 text-gray-500">
            <p>Aucun planning disponible pour cette semaine</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Séances à venir (30 jours) -->
    <div v-if="!loading && !error" class="bg-white shadow rounded-lg p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Séances à venir (30 jours)</h2>

      <div v-if="seances && seances.length > 0" class="space-y-4">
        <div
          v-for="seance in seances"
          :key="seance.id"
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">{{ seance.matiere?.nom }}</h3>

              <p class="flex items-center gap-2 text-gray-600 mt-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDate(seance.programmation?.date) }} | {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
                <span class="text-gray-400">({{ calculateDuration(seance) }} min)</span>
              </p>

              <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ seance.enseignant?.nom || 'Non assigné' }}
                </span>
                <span v-if="seance.salle" class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ seance.salle }}
                </span>
              </div>

              <!-- Badge visio si activé -->
              <div v-if="seance.visio_enabled" class="mt-2">
                <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center gap-1 inline-flex">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Visio {{ seance.visio_type }} activée
                </span>
              </div>
            </div>

            <!-- VisioManager: Gestion complète de la visio -->
            <VisioManager :seance="seance" @visio-updated="loadSeances" />
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        <p>Aucune séance programmée pour les 30 prochains jours</p>
      </div>
    </div>
    </div>
  </DashboardLayout>
</template>

<script>
import lmsService from '@/services/lms'
import klassciService from '@/services/klassci'
import { auth } from '@/services/api'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import VisioManager from '@/components/visio/VisioManager.vue'

export default {
  name: 'ClasseDetails',
  components: {
    DashboardLayout,
    VisioManager
  },

  data() {
    return {
      loading: false,
      error: null,
      activeTab: 'matieres',
      classe: null,
      matieres: [],
      etudiants: [],
      evaluations: [],
      emploiTemps: [],
      seances: [],
      statistiques: null
    }
  },

  computed: {
    classeId() {
      return parseInt(this.$route.params.id)
    },

    tabs() {
      return [
        { id: 'matieres', label: 'Matières', count: this.matieres?.length || 0 },
        { id: 'etudiants', label: 'Étudiants', count: this.etudiants?.length || 0 },
        { id: 'evaluations', label: 'Évaluations', count: this.evaluations?.length || 0 },
        { id: 'planning', label: 'Planning', count: this.emploiTemps?.length || 0 }
      ]
    },

    canManageVisio() {
      const user = auth.getUser()
      return user && ['coordinateur', 'superAdmin'].includes(user.role)
    }
  },

  mounted() {
    this.loadClasseDetails()
  },

  methods: {
    async loadClasseDetails() {
      this.loading = true
      this.error = null

      try {
        console.log('[ClasseDetails] Chargement détails classe:', this.classeId)

        // Appel via service LMS enrichi
        const data = await lmsService.getClasseDetails(this.classeId)

        console.log('[ClasseDetails] Données reçues:', data)

        if (data && data.success) {
          this.classe = data.data.classe
          this.evaluations = data.data.evaluations_programmees || []
          this.emploiTemps = data.data.emploi_temps_semaine || []
          this.statistiques = data.data.statistiques

          console.log('[ClasseDetails] Classe:', this.classe)
          console.log('[ClasseDetails] Évaluations:', this.evaluations.length)

          // Charger les matières directement depuis KLASSCI (comme AdminDashboard)
          await this.loadMatieres()

          // Charger les étudiants
          await this.loadEtudiants()

          // Charger les séances à venir
          await this.loadSeances()
        } else {
          this.error = data?.message || 'Impossible de charger les détails de la classe'
        }
      } catch (error) {
        console.error('[ClasseDetails] Erreur chargement classe:', error)
        this.error = error.response?.data?.message || 'Erreur lors du chargement des données'
      } finally {
        this.loading = false
      }
    },

    async loadEtudiants() {
      try {
        const response = await lmsService.getClasseEtudiants(this.classeId)
        if (response && response.success) {
          this.etudiants = response.data.etudiants || []
          console.log('[ClasseDetails] Étudiants:', this.etudiants.length)
        }
      } catch (error) {
        console.error('[ClasseDetails] Erreur chargement étudiants:', error)
      }
    },

    async loadMatieres() {
      try {
        // Charger toutes les matières depuis KLASSCI (comme AdminDashboard)
        const matieresData = await klassciService.getMatieres()
        this.matieres = matieresData || []
        console.log('[ClasseDetails] Matières chargées depuis KLASSCI:', this.matieres.length)
      } catch (error) {
        console.error('[ClasseDetails] Erreur chargement matières:', error)
        this.matieres = []
      }
    },

    async loadSeances() {
      try {
        const response = await lmsService.getUpcomingSeances({ classe_id: this.classeId, days: 30 })
        if (response && response.success) {
          this.seances = response.data.seances || []
          console.log('[ClasseDetails] Séances à venir:', this.seances.length)
        }
      } catch (error) {
        console.error('[ClasseDetails] Erreur chargement séances:', error)
      }
    },

    viewMatiere(matiereId) {
      this.$router.push({ name: 'matiere-details', params: { id: matiereId } })
    },

    viewEvaluation(evaluationId) {
      this.$router.push({ name: 'evaluation-details', params: { id: evaluationId } })
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },

    calculateDuration(seance) {
      if (!seance.programmation?.heure_debut || !seance.programmation?.heure_fin) return 0
      const debut = new Date(seance.programmation.heure_debut)
      const fin = new Date(seance.programmation.heure_fin)
      return Math.round((fin - debut) / (1000 * 60))
    },

    formatTime(isoTimestamp) {
      if (!isoTimestamp) return 'N/A'
      return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getEvaluationStatusClass(window) {
      if (!window) return 'bg-gray-100 text-gray-700'
      if (window.is_active) return 'bg-green-100 text-green-700'
      if (window.is_upcoming) return 'bg-blue-100 text-blue-700'
      if (window.is_past) return 'bg-gray-100 text-gray-700'
      return 'bg-yellow-100 text-yellow-700'
    },

    getEvaluationStatusLabel(window) {
      if (!window) return 'Non programmée'
      if (window.is_active) return 'En cours'
      if (window.is_upcoming) return `Ouvre ${window.time_until_start}`
      if (window.is_past) return 'Terminée'
      return 'Programmée'
    }
  }
}
</script>

<style scoped>
/* Container */
.classe-details {
  padding: 2rem;
}

/* Header Card */
.header-card {
  background: var(--card-bg);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid var(--color-primary, #10b981);
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.breadcrumb-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--text-primary);
}

.breadcrumb-current {
  font-weight: 500;
  color: var(--text-primary);
}

/* Page Title */
.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

/* Classe Info Line */
.classe-info-line {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  color: var(--text-secondary);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-item strong {
  color: var(--text-primary);
}

.info-icon {
  font-size: 1rem;
  line-height: 1;
}

/* Button Retour */
.btn-retour {
  padding: 0.625rem 1.25rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retour:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
}

/* Stats Grid Header */
.stats-grid-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat-card-header {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.stat-card-header:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-header-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.stat-icon-header {
  font-size: 1.25rem;
  line-height: 1;
}

.stat-label-header {
  font-size: 0.875rem;
}

.stat-value-header {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

/* Tabs Container */
.tabs-container {
  background: var(--bg-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  margin-bottom: 2rem;
}

.tabs-header {
  border-bottom: 1px solid var(--border-color);
}

.tabs-nav {
  display: flex;
  margin: 0;
  padding: 0;
}

.tab-button,
button[class*="px-6 py-4"] {
  padding: 1rem 1.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--text-secondary) !important;
  cursor: pointer;
  transition: none;
}

/* Active tab - VERY specific to override Tailwind */
.tab-button-active,
button[class*="px-6"][class*="py-4"][class*="border-green-600"],
button.px-6.py-4.font-medium.text-sm.border-b-2.transition.border-green-600.text-green-600 {
  border-bottom-color: #10b981 !important;
  color: #10b981 !important;
}

/* Disable hover effect */
button[class*="px-6 py-4"]:hover {
  /* No hover effect */
}

/* Badge in tabs */
button[class*="px-6 py-4"] span[class*="bg-green-100"] {
  background: #10b981 !important;
  color: white !important;
}

button[class*="px-6 py-4"] span[class*="bg-gray-100"] {
  background: var(--bg-secondary) !important;
  color: var(--text-secondary) !important;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-primary) !important;
}

thead {
  background: var(--bg-secondary) !important;
}

thead tr {
  background: var(--bg-secondary) !important;
}

th {
  padding: 0.75rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary) !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-secondary) !important;
}

tbody {
  background: var(--bg-primary) !important;
}

tbody tr {
  background: var(--bg-primary) !important;
}

td {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  background: var(--bg-primary) !important;
}

/* Force all table text to respect theme */
table td,
table td *:not(.active-badge):not([class*="bg-"]) {
  color: var(--text-primary) !important;
}

table th,
table th * {
  color: var(--text-secondary) !important;
}

/* Override any Tailwind bg classes in table */
table thead[class*="bg-gray"] {
  background: var(--bg-secondary) !important;
}

table tbody[class*="bg-white"] {
  background: var(--bg-primary) !important;
}

table tr[class*="bg-white"] {
  background: var(--bg-primary) !important;
}

tbody tr:hover {
  /* Hover disabled */
}

/* Badge styles */
span[class*="bg-blue-100"] {
  background: #dbeafe !important;
  color: #1e40af !important;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

span[class*="bg-green-100"] {
  background: #dcfce7 !important;
  color: #166534 !important;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

span[class*="bg-purple-100"] {
  background: #f3e8ff !important;
  color: #6b21a8 !important;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
}

span[class*="bg-gray-100"] {
  background: var(--bg-secondary) !important;
  color: var(--text-secondary) !important;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

span[class*="bg-yellow-100"] {
  background: #fef3c7 !important;
  color: #92400e !important;
}

/* Cards & Borders */
div[class*="border-gray-200"] {
  border: 1px solid var(--border-color) !important;
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.2s;
}

div[class*="border-gray-200"]:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Text Colors */
.text-gray-900,
div[class*="text-gray-900"] {
  color: var(--text-primary) !important;
}

.text-gray-600,
div[class*="text-gray-600"] {
  color: var(--text-secondary) !important;
}

.text-gray-500,
div[class*="text-gray-500"] {
  color: var(--text-secondary) !important;
}

.text-gray-400,
span[class*="text-gray-400"] {
  color: var(--text-tertiary) !important;
}

/* Force green color for active tabs (override Tailwind text-green-600) */
button[class*="text-green-600"],
.text-green-600 {
  color: #10b981 !important;
}

/* Buttons */
button[class*="text-green-600"] {
  color: #10b981 !important;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s;
}

button[class*="text-green-600"]:hover {
  color: #059669 !important;
}

/* Loading & Error States */
div[class*="bg-red-50"] {
  background: #fef2f2 !important;
  border: 1px solid #fca5a5;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}

button[class*="bg-red-600"] {
  background: #dc2626 !important;
  color: white !important;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}

button[class*="bg-red-600"]:hover {
  background: #b91c1c !important;
}

/* Séances Card */
div[class*="bg-white shadow rounded-lg"] {
  background: var(--bg-primary) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .classe-details {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid-header {
    grid-template-columns: 1fr;
  }

  .classe-info-line {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
