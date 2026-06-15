<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Quiz</h1>
        <p class="text-gray-600 mt-2">Testez vos connaissances</p>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Chargement des quiz...</p>
      </div>

      <!-- Liste des quiz -->
      <div v-else-if="quizzes.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="quiz in quizzes"
          :key="quiz.id"
          class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
        >
          <!-- En-tête du quiz -->
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-2xl font-bold text-gray-900">{{ quiz.title }}</h3>
              <p class="text-gray-600 mt-2">{{ quiz.description }}</p>
            </div>
            <i class="fa fa-pencil-square-o text-4xl"></i>
          </div>

          <!-- Informations -->
          <div class="space-y-2 mb-6 text-sm text-gray-600">
            <div class="flex items-center gap-2">
              <i class="fa fa-clock-o"></i>
              <span>Durée: {{ quiz.duration_minutes }} minutes</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa fa-bullseye"></i>
              <span>Score minimum: {{ quiz.passing_score }}%</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa fa-refresh"></i>
              <span>Tentatives max: {{ quiz.max_attempts || '∞' }}</span>
            </div>
          </div>

          <!-- Actions -->
          <button
            @click="startQuiz(quiz.id)"
            class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition"
          >
            Commencer le quiz
          </button>
        </div>
      </div>

      <!-- Aucun quiz -->
      <div v-else class="text-center py-12">
        <p class="text-gray-500 text-lg">Aucun quiz disponible</p>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { quizzes } from '@/services/api'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'

export default {
  name: 'Quizzes',
  components: {
    Navbar
  },
  data() {
    return {
      loading: true,
      quizzes: []
    }
  },
  async mounted() {
    await this.loadQuizzes()
  },
  methods: {
    async loadQuizzes() {
      this.loading = true

      try {
        const data = await quizzes.getAll()
        this.quizzes = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Erreur chargement quiz:', error)
        this.quizzes = []
      } finally {
        this.loading = false
      }
    },

    async startQuiz(quizId) {
      try {
        await quizzes.startAttempt(quizId)
        this.$router.push(`/quizzes/${quizId}/take`)
      } catch (error) {
        toast.error(error.userMessage ?? normalizeError(error).userMessage)
      }
    }
  }
}
</script>
