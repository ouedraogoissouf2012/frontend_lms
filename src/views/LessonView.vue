<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Chargement...</p>
      </div>

      <!-- Contenu de la leçon -->
      <div v-else-if="lesson" class="bg-white rounded-lg shadow-lg p-8">
        <!-- Bouton retour -->
        <button
          @click="$router.push('/lessons')"
          class="text-primary-600 hover:text-primary-700 mb-6 flex items-center"
        >
          ← Retour aux leçons
        </button>

        <!-- En-tête -->
        <div class="mb-8">
          <div class="flex justify-between items-start mb-4">
            <h1 class="text-4xl font-bold text-gray-900">{{ lesson.title }}</h1>
            <span
              class="px-3 py-1 text-sm rounded"
              :class="{
                'bg-green-100 text-green-800': lesson.status === 'published',
                'bg-yellow-100 text-yellow-800': lesson.status === 'draft'
              }"
            >
              {{ lesson.status }}
            </span>
          </div>

          <p class="text-gray-600 text-lg mb-4">{{ lesson.description }}</p>

          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span>📅 {{ formatDate(lesson.created_at) }}</span>
            <span>📚 {{ lesson.type }}</span>
          </div>
        </div>

        <!-- Contenu principal -->
        <div class="prose max-w-none">
          <div v-html="lesson.content" class="text-gray-700 leading-relaxed"></div>
        </div>

        <!-- Actions -->
        <div class="mt-8 pt-6 border-t flex justify-between">
          <button
            @click="markAsCompleted"
            class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Marquer comme terminé ✓
          </button>

          <button
            @click="$router.push('/lessons')"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold"
          >
            Retour à la liste
          </button>
        </div>
      </div>

      <!-- Erreur -->
      <div v-else class="text-center py-12">
        <p class="text-red-600">Leçon introuvable</p>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { lessons } from '@/services/api'

export default {
  name: 'LessonView',
  components: {
    Navbar
  },
  data() {
    return {
      loading: true,
      lesson: null
    }
  },
  async mounted() {
    await this.loadLesson()
  },
  methods: {
    async loadLesson() {
      this.loading = true

      try {
        const id = this.$route.params.id
        this.lesson = await lessons.getOne(id)
      } catch (error) {
        console.error('Erreur chargement leçon:', error)
        this.lesson = null
      } finally {
        this.loading = false
      }
    },

    markAsCompleted() {
      // TODO: Implémenter l'API de progression
      alert('Leçon marquée comme terminée ! (Fonction à implémenter)')
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.prose {
  font-size: 1.125rem;
  line-height: 1.75;
}
</style>
