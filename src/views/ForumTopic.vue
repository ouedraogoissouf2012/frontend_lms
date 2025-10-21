<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Chargement...</p>
      </div>

      <!-- Topic -->
      <div v-else-if="topic" class="space-y-6">
        <!-- Bouton retour -->
        <button
          @click="$router.push('/forum')"
          class="text-primary-600 hover:text-primary-700 flex items-center"
        >
          ← Retour au forum
        </button>

        <!-- Topic principal -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="flex items-start justify-between mb-4">
            <h1 class="text-3xl font-bold text-gray-900">{{ topic.title }}</h1>
            <div class="flex gap-2">
              <span v-if="topic.is_pinned" class="text-2xl">📌</span>
              <span v-if="topic.is_locked" class="text-2xl">🔒</span>
            </div>
          </div>

          <p class="text-gray-700 mb-6">{{ topic.content }}</p>

          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span>👤 {{ topic.user?.name || 'Anonyme' }}</span>
            <span>📅 {{ formatDate(topic.created_at) }}</span>
          </div>
        </div>

        <!-- Réponses -->
        <div class="space-y-4">
          <h2 class="text-xl font-bold text-gray-900">
            Réponses ({{ topic.posts?.length || 0 }})
          </h2>

          <div
            v-for="post in topic.posts"
            :key="post.id"
            class="bg-white rounded-lg shadow p-6"
          >
            <p class="text-gray-700 mb-4">{{ post.content }}</p>

            <div class="flex items-center gap-4 text-sm text-gray-500">
              <span>👤 {{ post.user?.name || 'Anonyme' }}</span>
              <span>📅 {{ formatDate(post.created_at) }}</span>
            </div>
          </div>

          <!-- Aucune réponse -->
          <div v-if="!topic.posts || topic.posts.length === 0" class="text-center py-8 text-gray-500">
            Aucune réponse pour le moment
          </div>
        </div>

        <!-- Formulaire de réponse -->
        <div v-if="!topic.is_locked" class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-bold mb-4">Ajouter une réponse</h3>

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
          <p class="text-yellow-800">🔒 Cette discussion est verrouillée</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { forum } from '@/services/api'

export default {
  name: 'ForumTopic',
  components: {
    Navbar
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
        this.topic = await forum.getTopic(topicId)
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
