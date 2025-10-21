<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Forum</h1>
        <p class="text-gray-600 mt-2">Discutez avec la communauté</p>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Chargement du forum...</p>
      </div>

      <!-- Liste des topics -->
      <div v-else class="bg-white rounded-lg shadow-lg divide-y">
        <div
          v-for="topic in topics"
          :key="topic.id"
          class="p-6 hover:bg-gray-50 cursor-pointer transition"
          @click="viewTopic(topic.id)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-xl font-semibold text-gray-900">{{ topic.title }}</h3>
                <span v-if="topic.is_pinned" class="text-yellow-500">📌</span>
                <span v-if="topic.is_locked" class="text-red-500">🔒</span>
              </div>

              <p class="text-gray-600 mb-3">{{ topic.content?.substring(0, 150) }}...</p>

              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span>👤 {{ topic.user?.name || 'Anonyme' }}</span>
                <span>💬 {{ topic.posts_count || 0 }} réponses</span>
                <span>📅 {{ formatDate(topic.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Aucun topic -->
        <div v-if="topics.length === 0" class="p-12 text-center text-gray-500">
          Aucune discussion pour le moment
        </div>
      </div>

      <!-- Bouton nouveau topic -->
      <button
        @click="showNewTopicModal = true"
        class="fixed bottom-8 right-8 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg text-2xl"
      >
        ➕
      </button>

      <!-- Modal nouveau topic (simple) -->
      <div
        v-if="showNewTopicModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="showNewTopicModal = false"
      >
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <h2 class="text-2xl font-bold mb-4">Nouvelle discussion</h2>

          <div class="mb-4">
            <label class="block text-gray-700 mb-2">Titre</label>
            <input
              v-model="newTopic.title"
              type="text"
              class="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Titre de la discussion"
            />
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 mb-2">Message</label>
            <textarea
              v-model="newTopic.content"
              rows="5"
              class="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Votre message..."
            ></textarea>
          </div>

          <div class="flex justify-end gap-4">
            <button
              @click="showNewTopicModal = false"
              class="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              @click="createTopic"
              class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { forum } from '@/services/api'

export default {
  name: 'Forum',
  components: {
    Navbar
  },
  data() {
    return {
      loading: true,
      topics: [],
      showNewTopicModal: false,
      newTopic: {
        title: '',
        content: '',
        category_id: 1 // Par défaut
      }
    }
  },
  async mounted() {
    await this.loadTopics()
  },
  methods: {
    async loadTopics() {
      this.loading = true

      try {
        // Charger une catégorie par défaut (ID 1)
        const data = await forum.getTopics(1)
        this.topics = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Erreur chargement forum:', error)
        this.topics = []
      } finally {
        this.loading = false
      }
    },

    viewTopic(id) {
      this.$router.push(`/forum/topics/${id}`)
    },

    async createTopic() {
      if (!this.newTopic.title || !this.newTopic.content) {
        alert('Veuillez remplir tous les champs')
        return
      }

      try {
        await forum.createTopic(this.newTopic)
        this.showNewTopicModal = false
        this.newTopic = { title: '', content: '', category_id: 1 }
        await this.loadTopics()
      } catch (error) {
        console.error('Erreur création topic:', error)
        alert('Erreur lors de la création de la discussion')
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  }
}
</script>
