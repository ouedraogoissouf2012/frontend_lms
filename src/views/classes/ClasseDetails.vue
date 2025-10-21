<template>
  <div class="classe-details">
    <!-- Header avec nom de la classe -->
    <div class="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg rounded-lg p-6 mb-6">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-green-100 text-sm mb-3">
            <button @click="$router.back()" class="hover:text-white transition">
              Dashboard
            </button>
            <span>›</span>
            <span class="text-white font-medium">Gestion de la Classe</span>
          </div>

          <!-- Nom de la classe -->
          <h1 class="text-4xl font-bold mb-2">
            {{ classe?.nom || 'Chargement...' }}
          </h1>

          <!-- Infos classe -->
          <div class="flex items-center gap-6 text-green-100">
            <span v-if="classe?.filiere" class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Filière: <strong class="text-white">{{ classe.filiere.nom }}</strong>
            </span>
            <span v-if="classe?.niveau" class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Niveau: <strong class="text-white">{{ classe.niveau.nom }}</strong>
            </span>
            <span v-if="classe?.code" class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Code: <strong class="text-white">{{ classe.code }}</strong>
            </span>
          </div>
        </div>

        <button
          @click="$router.back()"
          class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition backdrop-blur-sm"
        >
          ← Retour
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mt-6" v-if="statistiques">
        <div class="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <div class="flex items-center gap-2 text-sm text-green-100 font-medium mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Étudiants
          </div>
          <p class="text-2xl font-bold text-white">{{ statistiques.nombre_etudiants || 0 }}</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <div class="flex items-center gap-2 text-sm text-green-100 font-medium mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Matières
          </div>
          <p class="text-2xl font-bold text-white">{{ statistiques.nombre_matieres || 0 }}</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <div class="flex items-center gap-2 text-sm text-green-100 font-medium mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Évaluations
          </div>
          <p class="text-2xl font-bold text-white">{{ statistiques.nombre_evaluations || 0 }}</p>
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
    <div v-else class="bg-white shadow rounded-lg mb-6">
      <!-- Tab Headers -->
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
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
</template>

<script>
import lmsService from '@/services/lms'
import { auth } from '@/services/api'
import VisioManager from '@/components/visio/VisioManager.vue'

export default {
  name: 'ClasseDetails',
  components: {
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
          this.matieres = data.data.matieres_disponibles || []
          this.evaluations = data.data.evaluations_programmees || []
          this.emploiTemps = data.data.emploi_temps_semaine || []
          this.statistiques = data.data.statistiques

          console.log('[ClasseDetails] Classe:', this.classe)
          console.log('[ClasseDetails] Matières:', this.matieres.length)
          console.log('[ClasseDetails] Évaluations:', this.evaluations.length)

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
.classe-details {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}
</style>
