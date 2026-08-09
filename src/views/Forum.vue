<template>
  <DashboardLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold !text-primary-600 dark:!text-white">Forum</h1>
        <p class="!text-gray-600 dark:!text-gray-400 mt-2">Discutez avec la communauté</p>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">Chargement du forum...</p>
      </div>

      <!-- Liste des topics -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-lg divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="topic in topics"
          :key="topic.id"
          class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
          @click="viewTopic(topic.id)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ topic.title }}</h3>
                <span v-if="topic.is_pinned" class="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                  Épinglé
                </span>
                <span v-if="topic.is_locked" class="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded">
                  Verrouillé
                </span>
              </div>

              <p class="text-gray-600 dark:text-gray-300 mb-3">{{ topic.content?.substring(0, 150) }}...</p>

              <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                  </svg>
                  {{ topic.user?.name || 'Anonyme' }}
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                  </svg>
                  {{ topic.posts_count || 0 }} réponses
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                  </svg>
                  {{ formatDate(topic.created_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Aucun topic -->
        <div v-if="topics.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
          Aucune discussion pour le moment
        </div>
      </div>

      <!-- Bouton nouveau topic -->
      <button
        @click="showNewTopicModal = true"
        class="fixed bottom-8 right-8 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nouvelle discussion
      </button>

      <Modal
        v-model="showNewTopicModal"
        title="Nouvelle discussion"
        size="lg"
        class="forum-topic-modal"
      >
        <form id="forum-new-topic-form" @submit.prevent="createTopic">
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
        </form>

        <template #footer>
          <BaseButton variant="secondary" @click="showNewTopicModal = false">
            Annuler
          </BaseButton>
          <BaseButton type="submit" form="forum-new-topic-form" :loading="submitting">
            Publier
          </BaseButton>
        </template>
      </Modal>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Modal from '@/components/ui/Modal.vue'
import { forum } from '@/services/api'

defineOptions({ name: 'Forum' })

const router = useRouter()
const loading = ref(true)
const topics = ref([])
const showNewTopicModal = ref(false)
const submitting = ref(false) // #235 : garde anti double-soumission de topic
const newTopic = reactive({
  title: '',
  content: ''
})

async function loadTopics() {
  loading.value = true

  try {
    // Charger tous les topics (sans filtre)
    const response = await forum.getTopics()

    // Si c'est paginé, extraire les données
    if (response.data && response.data.data) {
      topics.value = Array.isArray(response.data.data) ? response.data.data : []
    } else if (response.data) {
      topics.value = Array.isArray(response.data) ? response.data : []
    } else {
      topics.value = []
    }
  } catch (error) {
    console.error('Erreur chargement forum:', error)
    topics.value = []
  } finally {
    loading.value = false
  }
}

function viewTopic(id) {
  router.push(`/forum/topics/${id}`)
}

async function createTopic() {
  if (!newTopic.title || !newTopic.content) {
    alert('Veuillez remplir tous les champs')
    return
  }
  if (submitting.value) return // #235 : évite le doublon sur double-clic

  submitting.value = true
  try {
    await forum.createTopic({ ...newTopic })
    showNewTopicModal.value = false
    newTopic.title = ''
    newTopic.content = ''
    await loadTopics()
  } catch (error) {
    console.error('Erreur création topic:', error)
    alert('Erreur lors de la création de la discussion')
  } finally {
    submitting.value = false
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(loadTopics)
</script>

<style scoped>
/* Force text colors for both light and dark mode - Using data-theme */
html[data-theme="light"] h1,
html:not([data-theme="dark"]) h1 {
  color: var(--color-info-strong) !important;
}

html[data-theme="dark"] h1 {
  color: var(--white) !important;
}

/* Modal inputs - BOTH modes support */
html[data-theme="light"] input[type="text"],
html:not([data-theme="dark"]) input[type="text"],
html[data-theme="light"] textarea,
html:not([data-theme="dark"]) textarea {
  background-color: var(--white) !important;
  color: var(--gray-800) !important;
}

html[data-theme="dark"] input[type="text"],
html[data-theme="dark"] textarea {
  background-color: var(--gray-700) !important;
  color: var(--gray-100) !important;
}

html[data-theme="light"] input[type="text"]::placeholder,
html:not([data-theme="dark"]) input[type="text"]::placeholder,
html[data-theme="light"] textarea::placeholder,
html:not([data-theme="dark"]) textarea::placeholder {
  color: var(--gray-400) !important;
  opacity: 1;
}

html[data-theme="dark"] input[type="text"]::placeholder,
html[data-theme="dark"] textarea::placeholder {
  color: var(--gray-400) !important;
  opacity: 1;
}

/* Modal background */
html[data-theme="light"] .bg-white,
html:not([data-theme="dark"]) .bg-white {
  background-color: var(--white) !important;
}

html[data-theme="dark"] .bg-white {
  background-color: var(--gray-800) !important;
}

/* Modal text */
html[data-theme="light"] .text-gray-700,
html:not([data-theme="dark"]) .text-gray-700 {
  color: var(--gray-700) !important;
}

html[data-theme="dark"] .text-gray-700 {
  color: var(--gray-200) !important;
}
</style>
