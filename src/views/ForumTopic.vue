<template>
  <DashboardLayout>
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>

      <!-- Topic -->
      <div v-else-if="topic" class="space-y-6">
        <!-- Bouton retour -->
        <button
          @click="$router.push('/forum')"
          class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
        >
          ← Retour au forum
        </button>

        <!-- Topic principal -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div class="flex items-start justify-between mb-4">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ topic.title }}</h1>
            <div class="flex gap-2">
              <span v-if="topic.is_pinned" class="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded">
                Épinglé
              </span>
              <span v-if="topic.is_locked" class="inline-flex items-center px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded">
                Verrouillé
              </span>
            </div>
          </div>

          <p class="text-gray-700 dark:text-gray-300 mb-6">{{ topic.content }}</p>

          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
              {{ topic.user?.name || 'Anonyme' }}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              {{ formatDate(topic.created_at) }}
            </span>
          </div>
        </div>

        <!-- Réponses -->
        <div class="space-y-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            Réponses ({{ topic.posts?.length || 0 }})
          </h2>

          <div
            v-for="post in topic.posts"
            :key="post.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <p class="text-gray-700 dark:text-gray-300 mb-4">{{ post.content }}</p>

            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
                {{ post.user?.name || 'Anonyme' }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                </svg>
                {{ formatDate(post.created_at) }}
              </span>
            </div>
          </div>

          <!-- Aucune réponse -->
          <div v-if="!topic.posts || topic.posts.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucune réponse pour le moment
          </div>
        </div>

        <!-- Formulaire de réponse -->
        <div v-if="!topic.is_locked" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Ajouter une réponse</h3>

          <textarea
            v-model="replyContent"
            rows="4"
            class="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Votre réponse..."
          ></textarea>

          <button
            @click="submitReply"
            class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Publier la réponse
          </button>
        </div>

        <!-- Topic verrouillé -->
        <div v-else class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div class="flex items-center justify-center gap-2 text-yellow-800">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
            </svg>
            <p class="font-semibold">Cette discussion est verrouillée</p>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { forum } from '@/services/api'

export default {
  name: 'ForumTopic',
  components: {
    DashboardLayout
  },
  data() {
    return {
      loading: true,
      topic: null,
      replyContent: ''
    }
  },
  async mounted() {
    await this.loadTopic()
  },
  methods: {
    async loadTopic() {
      this.loading = true

      try {
        const topicId = this.$route.params.id
        const response = await forum.getTopic(topicId)

        // Extraire les données de la réponse
        if (response.data) {
          this.topic = response.data
        } else {
          this.topic = response
        }
      } catch (error) {
        console.error('Erreur chargement topic:', error)
        alert('Impossible de charger la discussion')
        this.$router.push('/forum')
      } finally {
        this.loading = false
      }
    },

    async submitReply() {
      if (!this.replyContent.trim()) {
        alert('Veuillez écrire une réponse')
        return
      }

      try {
        const topicId = this.$route.params.id
        await forum.replyToTopic(topicId, this.replyContent)

        this.replyContent = ''
        await this.loadTopic()
      } catch (error) {
        console.error('Erreur publication réponse:', error)
        alert('Erreur lors de la publication de la réponse')
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
/* Dark mode fixes for textarea */
textarea {
  background-color: #ffffff;
  color: #1f2937;
}

textarea::placeholder {
  color: #9ca3af;
  opacity: 1;
}

textarea:focus {
  background-color: #ffffff;
  color: #1f2937;
}
</style>
