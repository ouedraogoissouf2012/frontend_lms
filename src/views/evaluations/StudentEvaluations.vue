<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Mes Évaluations</h1>
        <p class="text-gray-600 mt-2">Consultez et passez vos évaluations en ligne</p>
      </div>

      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement des évaluations..." />

      <!-- Erreur -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {{ error }}
      </div>

      <!-- Liste des évaluations -->
      <div v-else>
        <div v-if="evaluations.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-gray-600 text-lg">Aucune évaluation disponible pour le moment</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="evaluation in evaluations"
            :key="evaluation.id"
            class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <!-- En-tête de la carte -->
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900">{{ evaluation.titre }}</h3>
                <p v-if="evaluation.description" class="text-gray-600 text-sm mt-1">
                  {{ evaluation.description }}
                </p>
              </div>
              <span
                :class="getStatusClass(evaluation)"
                class="px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ getStatusText(evaluation) }}
              </span>
            </div>

            <!-- Informations -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 text-sm text-gray-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Durée: {{ evaluation.duree_minutes }} minutes</span>
              </div>

              <div class="flex items-center gap-2 text-sm text-gray-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>{{ evaluation.questions_count || evaluation.questions?.length || 0 }} questions</span>
              </div>

              <div class="flex items-center gap-2 text-sm text-gray-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
                </svg>
                <span>Barème: {{ evaluation.programmation?.bareme || evaluation.bareme || 20 }}/20 - Coefficient: {{ evaluation.programmation?.coefficient || evaluation.coefficient || 1 }}</span>
              </div>

              <div v-if="evaluation.programmation?.date_evaluation || evaluation.date_evaluation" class="flex items-center gap-2 text-sm text-gray-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>{{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}</span>
              </div>
            </div>

            <!-- Fenêtre temporelle -->
            <div
              v-if="evaluation.programmation?.window"
              class="mb-4 p-4 rounded-lg border-2"
              :class="getWindowStatusClass(evaluation.programmation.window)"
            >
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                <p class="font-medium">
                  <span v-if="!evaluation.programmation.window.has_started">
                    Ouvrira le {{ formatDateTime(evaluation.programmation.window.start_at) }}
                  </span>
                  <span v-else-if="evaluation.programmation.window.is_open">
                    Disponible jusqu'au {{ formatDateTime(evaluation.programmation.window.end_at) }}
                    <span v-if="evaluation.programmation.window.time_left_minutes" class="text-sm">
                      ({{ evaluation.programmation.window.time_left_minutes }} min restantes)
                    </span>
                  </span>
                  <span v-else>
                    Fermée depuis le {{ formatDateTime(evaluation.programmation.window.end_at) }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Résultats si déjà passée -->
            <div v-if="evaluation.student_submission && evaluation.student_submission.status === 'soumis'" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm font-medium text-blue-900">Note obtenue</p>
                  <p class="text-2xl font-bold text-blue-600">
                    {{ evaluation.student_submission.note_sur_20 }}/20
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-blue-700">Score: {{ evaluation.student_submission.score }} points</p>
                  <p class="text-xs text-blue-600">Soumis le {{ formatDate(evaluation.student_submission.submitted_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                v-if="!evaluation.student_submission"
                @click="startEvaluation(evaluation)"
                :disabled="!canStartEvaluation(evaluation)"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg font-medium transition',
                  canStartEvaluation(evaluation)
                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                ]"
              >
                <span v-if="!evaluation.programmation?.window">
                  Commencer l'évaluation
                </span>
                <span v-else-if="!evaluation.programmation.window.has_started">
                  Pas encore ouverte
                </span>
                <span v-else-if="evaluation.programmation.window.is_open">
                  Commencer l'évaluation
                </span>
                <span v-else>
                  Évaluation fermée
                </span>
              </button>
              <button
                v-else-if="evaluation.student_submission.status === 'en_cours'"
                @click="continueEvaluation(evaluation)"
                class="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Continuer l'évaluation
              </button>
              <button
                v-else-if="evaluation.allow_retake && evaluation.student_submission.status === 'soumis'"
                @click="retakeEvaluation(evaluation)"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Refaire l'évaluation
              </button>
              <button
                v-else
                disabled
                class="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
              >
                Évaluation terminée
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import evaluationService from '@/services/evaluation'
import { auth } from '@/services/api'
import ContentLoader from '@/components/common/ContentLoader.vue'

export default {
  name: 'StudentEvaluations',
  components: {
    ContentLoader
  },
  data() {
    return {
      evaluations: [],
      loading: true,
      error: null,
      user: null
    }
  },
  async mounted() {
    this.user = auth.getUser()
    if (!this.user) {
      this.$router.push('/login')
      return
    }
    await this.loadEvaluations()
  },
  methods: {
    async loadEvaluations() {
      this.loading = true
      this.error = null
      try {
        const result = await evaluationService.getStudentEvaluations(this.user.klassci_id)
        if (result.success) {
          this.evaluations = result.data
        } else {
          this.error = 'Erreur lors du chargement des évaluations'
        }
      } catch (error) {
        console.error('Erreur chargement évaluations:', error)
        this.error = 'Impossible de charger les évaluations'
      } finally {
        this.loading = false
      }
    },

    getStatusText(evaluation) {
      if (evaluation.student_submission) {
        if (evaluation.student_submission.status === 'en_cours') return 'En cours'
        if (evaluation.student_submission.status === 'soumis') return 'Terminée'
      }
      return evaluation.status === 'en_cours' ? 'Disponible' : 'Planifiée'
    },

    getStatusClass(evaluation) {
      if (evaluation.student_submission?.status === 'soumis') {
        return 'bg-green-100 text-green-800'
      }
      if (evaluation.student_submission?.status === 'en_cours') {
        return 'bg-orange-100 text-orange-800'
      }
      return 'bg-blue-100 text-blue-800'
    },

    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatDateTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    canStartEvaluation(evaluation) {
      // Pas de soumission terminée
      if (evaluation.student_submission?.status === 'soumis') {
        return false
      }

      // Vérifier la fenêtre temporelle
      if (evaluation.programmation?.window) {
        return evaluation.programmation.window.is_open === true
      }

      // Si pas de fenêtre (anciennes évaluations), autoriser
      return true
    },

    getWindowStatusClass(window) {
      if (!window.has_started) {
        return 'bg-orange-50 border-orange-300 text-orange-800'
      }
      if (window.is_open) {
        return 'bg-green-50 border-green-300 text-green-800'
      }
      return 'bg-red-50 border-red-300 text-red-800'
    },

    async startEvaluation(evaluation) {
      try {
        const result = await evaluationService.startEvaluation(evaluation.id, this.user.klassci_id)
        if (result.success) {
          this.$router.push({
            name: 'TakeEvaluation',
            params: { id: evaluation.id },
            query: { submission_id: result.data.id }
          })
        }
      } catch (error) {
        console.error('Erreur démarrage évaluation:', error)
        alert('Impossible de démarrer l\'évaluation')
      }
    },

    continueEvaluation(evaluation) {
      this.$router.push({
        name: 'TakeEvaluation',
        params: { id: evaluation.id },
        query: { submission_id: evaluation.student_submission.id }
      })
    },

    async retakeEvaluation(evaluation) {
      await this.startEvaluation(evaluation)
    }
  }
}
</script>
