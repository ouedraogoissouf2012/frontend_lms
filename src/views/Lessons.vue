<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- En-tête -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Leçons</h1>
          <p class="text-gray-600 mt-2">Parcourez tous les cours disponibles</p>
        </div>

        <!-- Filtre par statut (pour enseignants) -->
        <div v-if="user?.role === 'enseignant'" class="flex gap-2">
          <button
            @click="filterStatus = 'all'"
            :class="filterStatus === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'"
            class="px-4 py-2 rounded-lg border"
          >
            Tous
          </button>
          <button
            @click="filterStatus = 'published'"
            :class="filterStatus === 'published' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'"
            class="px-4 py-2 rounded-lg border"
          >
            Publiés
          </button>
          <button
            @click="filterStatus = 'draft'"
            :class="filterStatus === 'draft' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'"
            class="px-4 py-2 rounded-lg border"
          >
            Brouillons
          </button>
        </div>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Chargement des leçons...</p>
      </div>

      <!-- Liste des leçons -->
      <div v-else-if="filteredLessons.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="lesson in filteredLessons"
          :key="lesson.id"
          class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
          @click="viewLesson(lesson.id)"
        >
          <!-- Image placeholder -->
          <div class="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span class="text-white text-6xl">📚</span>
          </div>

          <!-- Contenu -->
          <div class="p-6">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-xl font-bold text-gray-900">{{ lesson.title }}</h3>
              <span
                class="px-2 py-1 text-xs rounded"
                :class="{
                  'bg-green-100 text-green-800': lesson.status === 'published',
                  'bg-yellow-100 text-yellow-800': lesson.status === 'draft',
                  'bg-gray-100 text-gray-800': lesson.status === 'archived'
                }"
              >
                {{ lesson.status }}
              </span>
            </div>

            <p class="text-gray-600 mb-4 line-clamp-3">{{ lesson.description }}</p>

            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>{{ lesson.type }}</span>
              <span>{{ formatDate(lesson.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Aucune leçon -->
      <div v-else class="text-center py-12">
        <p class="text-gray-500 text-lg">Aucune leçon disponible</p>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { lessons, auth } from '@/services/api'

export default {
  name: 'Lessons',
  components: {
    Navbar
  },
  data() {
    return {
      user: null,
      loading: true,
      allLessons: [],
      filterStatus: 'all'
    }
  },
  computed: {
    filteredLessons() {
      if (this.filterStatus === 'all') {
        return this.allLessons
      }
      return this.allLessons.filter(lesson => lesson.status === this.filterStatus)
    }
  },
  async mounted() {
    this.user = auth.getUser()
    await this.loadLessons()
  },
  methods: {
    async loadLessons() {
      this.loading = true

      try {
        const data = await lessons.getAll()
        this.allLessons = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Erreur chargement leçons:', error)
        this.allLessons = []
      } finally {
        this.loading = false
      }
    },

    viewLesson(id) {
      this.$router.push(`/lessons/${id}`)
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('fr-FR')
    }
  }
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
