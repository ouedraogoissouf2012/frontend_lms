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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700 light-mode-card">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h1 class="text-3xl font-bold forum-title mb-2">{{ topic.title }}</h1>
              <div class="flex gap-2 mt-2">
                <span v-if="topic.is_pinned" class="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                  <i class="fa fa-thumb-tack"></i> Épinglé
                </span>
                <span v-if="topic.status === 'closed'" class="inline-flex items-center px-3 py-1 text-sm font-medium text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-full">
                  <i class="fa fa-lock"></i> Fermé
                </span>
                <span v-if="topic.is_resolved" class="inline-flex items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200 rounded-full">
                  <i class="fa fa-check"></i> Résolu
                </span>
              </div>
            </div>
          </div>

          <p class="forum-text mb-6 text-lg leading-relaxed">{{ topic.content }}</p>

          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
              <span class="font-medium">{{ topic.user?.name || 'Anonyme' }}</span>
            </span>
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              {{ formatDate(topic.created_at) }}
            </span>
            <span v-if="topic.views_count" class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
              </svg>
              {{ topic.views_count }} vues
            </span>
          </div>
        </div>

        <!-- Réponses -->
        <div class="space-y-4">
          <h2 class="text-xl font-bold forum-title">
            Réponses ({{ topic.posts?.length || 0 }})
          </h2>

          <div
            v-for="post in topic.posts"
            :key="post.id"
            :class="[
              'rounded-lg shadow-md p-6 border transition-all light-mode-card',
              post.is_solution
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                : 'bg-gray-50 dark:bg-gray-750 border-gray-200 dark:border-gray-600'
            ]"
          >
            <!-- Badge solution -->
            <div v-if="post.is_solution" class="flex items-center gap-2 mb-4">
              <span class="inline-flex items-center px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 dark:bg-green-800 dark:text-green-100 rounded-full">
                <i class="fa fa-check-circle"></i> Solution acceptée
              </span>
            </div>

            <!-- Contenu de la réponse -->
            <p class="forum-text mb-4 text-base leading-relaxed">{{ post.content }}</p>

            <!-- Badge édité -->
            <div v-if="post.is_edited" class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">
              <i class="fa fa-pencil"></i> Modifié {{ post.edited_at ? 'le ' + formatDate(post.edited_at) : '' }}
            </div>

            <!-- Footer avec auteur et actions -->
            <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-4">
              <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                  </svg>
                  <span class="font-medium">{{ post.user?.name || 'Anonyme' }}</span>
                </span>
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                  </svg>
                  {{ formatDate(post.created_at) }}
                </span>
              </div>

              <!-- Bouton marquer comme solution -->
              <button
                v-if="canMarkAsSolution(post) && !post.is_solution"
                @click="markAsSolution(post.id)"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Marquer comme solution
              </button>
            </div>
          </div>

          <!-- Aucune réponse -->
          <div v-if="!topic.posts || topic.posts.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucune réponse pour le moment
          </div>
        </div>

        <!-- Formulaire de réponse -->
        <div v-if="!topic.is_locked && topic.status !== 'closed'" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 light-mode-card">
          <h3 class="text-lg font-bold forum-title mb-4">Ajouter une réponse</h3>

          <textarea
            v-model="replyContent"
            rows="5"
            class="forum-textarea w-full border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            placeholder="Écrivez votre réponse ici..."
          ></textarea>

          <div class="flex justify-between items-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Soyez respectueux et constructif dans vos réponses
            </p>
            <button
              @click="submitReply"
              :disabled="!replyContent.trim()"
              :class="[
                'px-6 py-2.5 rounded-lg font-semibold transition-colors',
                replyContent.trim()
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              ]"
            >
              Publier la réponse
            </button>
          </div>
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
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'ForumTopic',
  components: {
    DashboardLayout
  },
  data() {
    return {
      loading: true,
      topic: null,
      replyContent: '',
      currentUser: null
    }
  },
  async mounted() {
    await this.loadTopic()
    this.getCurrentUser()
  },
  methods: {
    getCurrentUser() {
      // Récupérer l'utilisateur connecté depuis le store (#19) — plus de localStorage('user')
      this.currentUser = useAuthStore().currentUser
    },

    canMarkAsSolution(post) {
      // Seul l'auteur du topic, un enseignant ou un admin peut marquer une solution
      if (!this.currentUser) return false

      const isTopicAuthor = this.topic.user_id === this.currentUser.id
      const isTeacher = this.currentUser.role === 'enseignant' || this.currentUser.role === 'teacher'
      const isAdmin = this.currentUser.role === 'coordinateur' || this.currentUser.role === 'admin' || this.currentUser.role === 'superAdmin'

      return isTopicAuthor || isTeacher || isAdmin
    },

    async markAsSolution(postId) {
      if (!confirm('Marquer cette réponse comme solution?')) return

      try {
        await forum.markAsSolution(postId)
        await this.loadTopic()
      } catch (error) {
        console.error('Erreur marquage solution:', error)
        alert('Erreur lors du marquage de la solution')
      }
    },
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
/* Force proper backgrounds for BOTH modes - Using data-theme attribute */
html[data-theme="light"] .light-mode-card,
html:not([data-theme="dark"]) .light-mode-card {
  background-color: #ffffff !important;
}

html[data-theme="dark"] .light-mode-card {
  background-color: #1f2937 !important;
}

/* Custom background for better contrast in dark mode */
html[data-theme="dark"] .bg-gray-750 {
  background-color: #2d3748 !important;
}

/* Force backgrounds for response cards */
html[data-theme="light"] .bg-gray-50,
html:not([data-theme="dark"]) .bg-gray-50 {
  background-color: #f9fafb !important;
}

html[data-theme="dark"] .bg-gray-50 {
  background-color: #2d3748 !important;
}

/* Textarea styling - FORCE visible text in all modes */
html[data-theme="light"] .forum-textarea,
html:not([data-theme="dark"]) .forum-textarea {
  background-color: #ffffff !important;
  color: #1f2937 !important;
}

html[data-theme="dark"] .forum-textarea {
  background-color: #374151 !important;
  color: #f3f4f6 !important;
}

html[data-theme="light"] .forum-textarea::placeholder,
html:not([data-theme="dark"]) .forum-textarea::placeholder {
  color: #9ca3af !important;
  opacity: 1;
}

html[data-theme="dark"] .forum-textarea::placeholder {
  color: #9ca3af !important;
  opacity: 1;
}

.forum-textarea:focus {
  outline: none;
  ring: 2px;
}

/* Smooth transitions for theme changes */
textarea,
button {
  transition: all 0.2s ease-in-out;
}

/* Ensure proper textarea styling */
textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Text styling - FORCE visible text in all modes */
html[data-theme="light"] .forum-title,
html:not([data-theme="dark"]) .forum-title {
  color: #1f2937 !important;
}

html[data-theme="dark"] .forum-title {
  color: #ffffff !important;
}

html[data-theme="light"] .forum-text,
html:not([data-theme="dark"]) .forum-text {
  color: #374151 !important;
}

html[data-theme="dark"] .forum-text {
  color: #e5e7eb !important;
}

/* Light mode text colors */
html[data-theme="light"] .text-gray-800,
html:not([data-theme="dark"]) .text-gray-800 {
  color: #1f2937 !important;
}

html[data-theme="light"] .text-gray-600,
html:not([data-theme="dark"]) .text-gray-600 {
  color: #4b5563 !important;
}

html[data-theme="light"] .text-gray-500,
html:not([data-theme="dark"]) .text-gray-500 {
  color: #6b7280 !important;
}

html[data-theme="light"] .text-gray-400,
html:not([data-theme="dark"]) .text-gray-400 {
  color: #9ca3af !important;
}
</style>
