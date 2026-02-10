<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p class="text-gray-600 mt-2">Bienvenue, {{ user?.name }}</p>
      </div>

      <!-- Chargement -->
      <ContentLoader v-if="loading" text="Chargement du tableau de bord..." />

      <!-- Statistiques -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Carte 1 : Leçons -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Leçons en cours</p>
              <p class="text-3xl font-bold text-primary-600">{{ stats.lessons_in_progress || 0 }}</p>
            </div>
            <div class="bg-primary-100 p-3 rounded-full">
              fa-book
            </div>
          </div>
        </div>

        <!-- Carte 2 : Quiz -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Quiz complétés</p>
              <p class="text-3xl font-bold text-green-600">{{ stats.quizzes_completed || 0 }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              fa-check-circle
            </div>
          </div>
        </div>

        <!-- Carte 3 : Progression -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Progression globale</p>
              <p class="text-3xl font-bold text-purple-600">{{ stats.overall_progress || 0 }}%</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
              fa-bar-chart
            </div>
          </div>
        </div>
      </div>

      <!-- Leçons récentes -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Leçons récentes</h2>

        <div v-if="recentLessons.length === 0" class="text-center py-8 text-gray-500">
          Aucune leçon disponible pour le moment
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="lesson in recentLessons"
            :key="lesson.id"
            class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            @click="$router.push(`/lessons/${lesson.id}`)"
          >
            <h3 class="font-semibold text-lg">{{ lesson.title }}</h3>
            <p class="text-gray-600 text-sm mt-1">{{ lesson.description }}</p>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ lesson.type }}</span>
              <span
                class="px-2 py-1 text-xs rounded"
                :class="lesson.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              >
                {{ lesson.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications récentes -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">Notifications récentes</h2>

        <div v-if="notifications.length === 0" class="text-center py-8 text-gray-500">
          Aucune notification
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="notif in notifications"
            :key="notif.id"
            class="border-l-4 border-primary-500 pl-4 py-2"
          >
            <p class="font-semibold">{{ notif.title }}</p>
            <p class="text-sm text-gray-600">{{ notif.message }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(notif.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { dashboard, lessons as lessonsApi, notifications as notificationsApi, auth } from '@/services/api'

export default {
  name: 'Dashboard',
  components: {
    Navbar,
    ContentLoader
  },
  data() {
    return {
      user: null,
      loading: true,
      stats: {},
      recentLessons: [],
      notifications: []
    }
  },
  async mounted() {
    this.user = auth.getUser()
    await this.loadDashboard()
  },
  methods: {
    async loadDashboard() {
      this.loading = true

      try {
        // Charger les stats selon le rôle
        const role = this.user?.role
        if (role === 'étudiant') {
          this.stats = await dashboard.getStudentDashboard()
        } else if (role === 'enseignant') {
          this.stats = await dashboard.getTeacherDashboard()
        }

        // Charger les leçons récentes
        const lessonsData = await lessonsApi.getAll({ limit: 5 })
        this.recentLessons = Array.isArray(lessonsData) ? lessonsData : []

        // Charger les notifications
        const notifsData = await notificationsApi.getAll({ limit: 5 })
        this.notifications = Array.isArray(notifsData) ? notifsData : []

      } catch (error) {
        console.error('Erreur chargement dashboard:', error)
      } finally {
        this.loading = false
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>
