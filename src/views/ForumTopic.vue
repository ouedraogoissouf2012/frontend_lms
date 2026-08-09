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
          @click="goToForum"
          class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
        >
          ← Retour au forum
        </button>

        <ForumTopicHeader :topic="topic" :format-date="formatDate" />

        <ForumPostList
          :topic="topic"
          :format-date="formatDate"
          :can-mark-as-solution="canMarkAsSolution"
          @mark-solution="markAsSolution"
        />

        <ForumReplyForm
          :topic="topic"
          :submitting="submitting"
          v-model="replyContent"
          @submit="submitReply"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Vue d'un sujet de forum. Orchestrateur (#G1 ≤300) : toute la donnée et la
 * logique vivent dans useForumTopic (chargement du sujet, droits, réponse,
 * marquage de solution, format de date) ; l'UI est composée de ForumTopicHeader,
 * ForumPostList et ForumReplyForm. Parité stricte avec l'ancienne Options API.
 */
import { onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ForumTopicHeader from '@/components/forum/ForumTopicHeader.vue'
import ForumPostList from '@/components/forum/ForumPostList.vue'
import ForumReplyForm from '@/components/forum/ForumReplyForm.vue'
import { useForumTopic } from '@/composables/useForumTopic'

const {
  loading,
  topic,
  replyContent,
  submitting,
  canMarkAsSolution,
  markAsSolution,
  submitReply,
  formatDate,
  init,
  goToForum,
} = useForumTopic()

onMounted(init)
</script>

<style scoped>
/* Force proper backgrounds for BOTH modes - Using data-theme attribute */
html[data-theme="light"] .light-mode-card,
html:not([data-theme="dark"]) .light-mode-card {
  background-color: var(--white) !important;
}

html[data-theme="dark"] .light-mode-card {
  background-color: var(--gray-800) !important;
}

/* Custom background for better contrast in dark mode */
html[data-theme="dark"] .bg-gray-750 {
  background-color: var(--slate-800) !important;
}

/* Force backgrounds for response cards */
html[data-theme="light"] .bg-gray-50,
html:not([data-theme="dark"]) .bg-gray-50 {
  background-color: var(--gray-50) !important;
}

html[data-theme="dark"] .bg-gray-50 {
  background-color: var(--slate-800) !important;
}

/* Textarea styling - FORCE visible text in all modes */
html[data-theme="light"] .forum-textarea,
html:not([data-theme="dark"]) .forum-textarea {
  background-color: var(--white) !important;
  color: var(--gray-800) !important;
}

html[data-theme="dark"] .forum-textarea {
  background-color: var(--gray-700) !important;
  color: var(--gray-100) !important;
}

html[data-theme="light"] .forum-textarea::placeholder,
html:not([data-theme="dark"]) .forum-textarea::placeholder {
  color: var(--gray-400) !important;
  opacity: 1;
}

html[data-theme="dark"] .forum-textarea::placeholder {
  color: var(--gray-400) !important;
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
  color: var(--gray-800) !important;
}

html[data-theme="dark"] .forum-title {
  color: var(--white) !important;
}

html[data-theme="light"] .forum-text,
html:not([data-theme="dark"]) .forum-text {
  color: var(--gray-700) !important;
}

html[data-theme="dark"] .forum-text {
  color: var(--gray-200) !important;
}

/* Light mode text colors */
html[data-theme="light"] .text-gray-800,
html:not([data-theme="dark"]) .text-gray-800 {
  color: var(--gray-800) !important;
}

html[data-theme="light"] .text-gray-600,
html:not([data-theme="dark"]) .text-gray-600 {
  color: var(--gray-600) !important;
}

html[data-theme="light"] .text-gray-500,
html:not([data-theme="dark"]) .text-gray-500 {
  color: var(--gray-500) !important;
}

html[data-theme="light"] .text-gray-400,
html:not([data-theme="dark"]) .text-gray-400 {
  color: var(--gray-400) !important;
}
</style>
