<template>
  <div class="matiere-details">
    <!-- Header avec nom de la matière -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg rounded-lg p-6 mb-6">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-blue-100 text-sm mb-3">
            <button @click="$router.back()" class="hover:text-white transition">
              Dashboard
            </button>
            <span>›</span>
            <span class="text-white font-medium">Gestion de la Matière</span>
          </div>

          <!-- Nom de la matière -->
          <h1 class="text-4xl font-bold mb-2">
            {{ matiere?.nom || 'Chargement...' }}
          </h1>

          <!-- Infos matière -->
          <div class="flex items-center gap-6 text-blue-100">
            <span v-if="matiere?.code" class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Code: <strong class="text-white">{{ matiere.code }}</strong>
            </span>
            <span v-if="matiere?.coefficient" class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Coefficient: <strong class="text-white">{{ matiere.coefficient }}</strong>
            </span>
            <span v-if="matiere?.heures?.total" class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Volume horaire: <strong class="text-white">{{ matiere.heures.total }}h</strong>
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
          <div class="flex items-center gap-2 text-sm text-blue-100 font-medium mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Lessons
          </div>
          <p class="text-2xl font-bold text-white">{{ statistiques.nombre_lessons || 0 }}</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <div class="flex items-center gap-2 text-sm text-blue-100 font-medium mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Séances
          </div>
          <p class="text-2xl font-bold text-white">{{ statistiques.nombre_seances_programmees || 0 }}</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
          <div class="flex items-center gap-2 text-sm text-blue-100 font-medium mb-2">
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
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Chargement...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-900 font-medium">{{ error }}</p>
      <button
        @click="loadMatiereDetails"
        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        Réessayer
      </button>
    </div>

    <!-- Tabs -->
    <div v-else class="bg-white shadow rounded-lg">
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
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              :class="[
                'ml-2 px-2 py-1 rounded-full text-xs',
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              ]"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Onglet Lessons -->
        <div v-if="activeTab === 'lessons'">
          <!-- Bouton création (enseignant uniquement) -->
          <div v-if="isTeacher" class="mb-4 flex justify-end">
            <button
              @click="createLesson"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Nouvelle leçon
            </button>
          </div>

          <div v-if="lessons && lessons.length > 0" class="space-y-4">
            <LessonCard
              v-for="lesson in lessons"
              :key="lesson.id"
              :lesson="lesson"
              :is-teacher="isTeacher"
              :show-progress="!isTeacher"
              :show-stats="isTeacher"
              :show-status="isTeacher"
              @view="viewLesson"
              @edit="editLesson"
              @delete="confirmDeleteLesson"
              @publish="publishLesson"
              @unpublish="unpublishLesson"
            />
          </div>

          <div v-else class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p class="font-medium text-gray-900 mb-2">Aucune leçon disponible</p>
            <p class="text-sm">{{ isTeacher ? 'Créez votre première leçon pour cette matière' : 'Aucune leçon n\'a encore été publiée' }}</p>
            <button
              v-if="isTeacher"
              @click="createLesson"
              class="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Créer ma première leçon
            </button>
          </div>
        </div>

        <!-- Onglet Séances -->
        <div v-if="activeTab === 'seances'">
          <div v-if="seances && seances.length > 0" class="space-y-4">
            <div
              v-for="seance in seances"
              :key="seance.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              @click="viewSeance(seance.id)"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ formatDate(seance.programmation?.date) }}
                    </h3>
                    <span
                      v-if="seance.visio_enabled"
                      class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Visio {{ seance.visio_type }}
                    </span>
                  </div>

                  <p class="flex items-center gap-2 text-gray-600 mt-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
                    <span class="text-gray-400">({{ calculateDuration(seance) }} min)</span>
                  </p>

                  <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ seance.enseignant?.nom || 'Non assigné' }}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {{ seance.classe?.nom || 'Non assigné' }}
                    </span>
                    <span v-if="seance.programmation?.salle" class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {{ seance.programmation.salle }}
                    </span>
                  </div>

                  <!-- Statut -->
                  <div class="mt-2">
                    <span
                      :class="[
                        'px-2 py-1 text-xs rounded',
                        getSeanceStatusClass(seance)
                      ]"
                    >
                      {{ getSeanceStatusLabel(seance) }}
                    </span>
                  </div>
                </div>

                <!-- VisioManager: Gestion complète de la visio -->
                <VisioManager :seance="seance" @visio-updated="loadMatiereDetails" />
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12 text-gray-500">
            <p>Aucune séance programmée pour cette matière</p>
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
                    <span
                      :class="[
                        'px-2 py-1 text-xs rounded',
                        getEvaluationStatusClass(evaluation.programmation.window)
                      ]"
                    >
                      {{ getEvaluationStatusLabel(evaluation.programmation.window) }}
                    </span>
                  </div>
                </div>

                <button class="text-blue-600 hover:text-blue-800">
                  →
                </button>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12 text-gray-500">
            <p>Aucune évaluation programmée pour cette matière</p>
          </div>
        </div>

        <!-- Onglet Classes -->
        <div v-if="activeTab === 'classes'">
          <div v-if="classes && classes.length > 0" class="space-y-4">
            <div
              v-for="classe in classes"
              :key="classe.id"
              class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              @click="viewClasse(classe.id)"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900">{{ classe.nom }}</h3>

                  <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span class="flex items-center gap-1" v-if="classe.filiere">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {{ classe.filiere.nom }}
                    </span>
                    <span class="flex items-center gap-1" v-if="classe.niveau">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {{ classe.niveau.nom }}
                    </span>
                    <span class="flex items-center gap-1" v-if="classe.effectif">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {{ classe.effectif }} étudiants
                    </span>
                  </div>
                </div>

                <button class="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                  Voir détails →
                </button>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12 text-gray-500">
            <p>Aucune classe ne suit cette matière</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import lmsService from '@/services/lms'
import lessonService from '@/services/lesson'
import VisioManager from '@/components/visio/VisioManager.vue'
import LessonCard from '@/components/lessons/LessonCard.vue'
import { auth } from '@/services/api'

export default {
  name: 'MatiereDetails',
  components: {
    VisioManager,
    LessonCard
  },

  data() {
    return {
      loading: false,
      error: null,
      activeTab: 'lessons',
      matiere: null,
      lessons: [],
      seances: [],
      evaluations: [],
      classes: [],
      statistiques: null
    }
  },

  computed: {
    matiereId() {
      return parseInt(this.$route.params.id)
    },

    tabs() {
      return [
        { id: 'lessons', label: 'Leçons', count: this.lessons?.length || 0 },
        { id: 'seances', label: 'Séances', count: this.seances?.length || 0 },
        { id: 'evaluations', label: 'Évaluations', count: this.evaluations?.length || 0 },
        { id: 'classes', label: 'Classes', count: this.classes?.length || 0 }
      ]
    },

    canManageVisio() {
      const user = lmsService.auth?.getUser?.() || {}
      return user && ['coordinateur', 'superAdmin'].includes(user.role)
    },

    isTeacher() {
      const user = auth.getUser()
      return user && ['enseignant', 'teacher', 'coordinateur'].includes(user.role)
    }
  },

  mounted() {
    this.loadMatiereDetails()
  },

  methods: {
    async loadMatiereDetails() {
      this.loading = true
      this.error = null

      try {
        console.log('[MatiereDetails] Chargement détails matière:', this.matiereId)

        // Appel via service LMS enrichi
        const data = await lmsService.getMatiereDetails(this.matiereId)

        console.log('[MatiereDetails] Données reçues (raw):', data)
        console.log('[MatiereDetails] data.success:', data.success)
        console.log('[MatiereDetails] data.data:', data.data)
        console.log('[MatiereDetails] Type de data:', typeof data)

        if (data && data.success) {
          this.matiere = data.data.matiere
          this.lessons = data.data.lessons || []
          this.seances = data.data.seances_programmees || []
          this.evaluations = data.data.evaluations_programmees || []
          this.classes = data.data.classes_concernees || []
          this.statistiques = data.data.statistiques

          console.log('[MatiereDetails] Matière assignée:', this.matiere)
          console.log('[MatiereDetails] Nom de la matière:', this.matiere?.nom)
          console.log('[MatiereDetails] Lessons:', this.lessons.length)
          console.log('[MatiereDetails] Séances:', this.seances.length)
          console.log('[MatiereDetails] Évaluations:', this.evaluations.length)
          console.log('[MatiereDetails] Classes:', this.classes.length)
          console.log('[MatiereDetails] Statistiques:', this.statistiques)
        } else {
          console.error('[MatiereDetails] Response success = false ou undefined')
          console.error('[MatiereDetails] Full response:', JSON.stringify(data, null, 2))
          this.error = data?.message || 'Impossible de charger les détails de la matière'
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur chargement matière:', error)
        console.error('[MatiereDetails] Error message:', error.message)
        console.error('[MatiereDetails] Error response:', error.response)
        console.error('[MatiereDetails] Error response data:', error.response?.data)
        this.error = error.response?.data?.message || 'Erreur lors du chargement des données'
      } finally {
        this.loading = false
      }
    },

    viewLesson(lessonId) {
      this.$router.push({ name: 'LessonView', params: { id: lessonId } })
    },

    createLesson() {
      this.$router.push({ name: 'LessonCreate' })
    },

    editLesson(lessonId) {
      this.$router.push({ name: 'LessonEdit', params: { id: lessonId } })
    },

    async confirmDeleteLesson(lessonId) {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) {
        return
      }

      try {
        const response = await lessonService.deleteLesson(lessonId)
        if (response.success) {
          alert('Leçon supprimée avec succès')
          this.loadMatiereDetails()
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur deleteLesson:', error)
        alert('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message))
      }
    },

    async publishLesson(lessonId) {
      try {
        const response = await lessonService.publishLesson(lessonId)
        if (response.success) {
          alert('Leçon publiée avec succès')
          this.loadMatiereDetails()
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur publishLesson:', error)
        alert('Erreur lors de la publication: ' + (error.response?.data?.message || error.message))
      }
    },

    async unpublishLesson(lessonId) {
      try {
        const response = await lessonService.unpublishLesson(lessonId)
        if (response.success) {
          alert('Leçon dépubliée avec succès')
          this.loadMatiereDetails()
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur unpublishLesson:', error)
        alert('Erreur lors de la dépublication: ' + (error.response?.data?.message || error.message))
      }
    },

    viewSeance(seanceId) {
      this.$router.push({ name: 'seance-details', params: { id: seanceId } })
    },

    viewEvaluation(evaluationId) {
      this.$router.push({ name: 'evaluation-view', params: { id: evaluationId } })
    },

    viewClasse(classeId) {
      this.$router.push({ name: 'classe-details', params: { id: classeId } })
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

    calculateDuration(seance) {
      // Utiliser programmation.heure_debut/fin (ISO 8601)
      if (!seance.programmation?.heure_debut || !seance.programmation?.heure_fin) return 0
      const debut = new Date(seance.programmation.heure_debut)
      const fin = new Date(seance.programmation.heure_fin)
      return Math.round((fin - debut) / 60000) // millisecondes → minutes
    },

    formatTime(isoTimestamp) {
      if (!isoTimestamp) return 'N/A'
      return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getSeanceStatusClass(seance) {
      const now = new Date()
      const seanceDate = new Date(`${seance.date_seance} ${seance.heure_debut}`)
      const seanceEnd = new Date(`${seance.date_seance} ${seance.heure_fin}`)

      if (now < seanceDate) return 'bg-orange-100 text-orange-700'
      if (now >= seanceDate && now <= seanceEnd) return 'bg-green-100 text-green-700'
      if (seance.statut === 'realise') return 'bg-blue-100 text-blue-700'
      return 'bg-gray-100 text-gray-700'
    },

    getSeanceStatusLabel(seance) {
      const now = new Date()
      const seanceDate = new Date(`${seance.date_seance} ${seance.heure_debut}`)
      const seanceEnd = new Date(`${seance.date_seance} ${seance.heure_fin}`)

      if (now < seanceDate) return 'À venir'
      if (now >= seanceDate && now <= seanceEnd) return 'En cours'
      if (seance.statut === 'realise') return 'Terminé'
      return 'Passé'
    },

    getEvaluationStatusClass(window) {
      if (!window.has_started) return 'bg-orange-100 text-orange-700'
      if (window.is_open) return 'bg-green-100 text-green-700'
      return 'bg-gray-100 text-gray-700'
    },

    getEvaluationStatusLabel(window) {
      if (!window.has_started) return 'Pas encore ouverte'
      if (window.is_open) return 'Ouverte'
      return 'Fermée'
    }
  }
}
</script>

<style scoped>
.matiere-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
