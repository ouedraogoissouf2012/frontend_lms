<template>
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
        @click="$emit('submit')"
        :disabled="!replyContent.trim() || submitting"
        :class="[
          'px-6 py-2.5 rounded-lg font-semibold transition-colors',
          (replyContent.trim() && !submitting)
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        ]"
      >
        {{ submitting ? 'Publication…' : 'Publier la réponse' }}
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
</template>

<script setup>
/**
 * Formulaire présentationnel de réponse (#G1 ≤300). Affiche soit le formulaire
 * (sujet ouvert), soit le bandeau « discussion verrouillée » (sujet verrouillé
 * ou fermé). Le contenu est en v-model (defineModel) ; émet `submit` au clic.
 * Aucune logique métier ni appel API.
 */
defineProps({
  topic: { type: Object, required: true },
  submitting: { type: Boolean, default: false }, // #235 : désactive pendant l'envoi
})

const replyContent = defineModel({ type: String, default: '' })

defineEmits(['submit'])
</script>

<style scoped>
/* Force proper backgrounds for BOTH modes - Using data-theme attribute */
html[data-theme="light"] .light-mode-card,
html:not([data-theme="dark"]) .light-mode-card {
  background-color: var(--card-bg) !important;
}

html[data-theme="dark"] .light-mode-card {
  background-color: var(--gray-800) !important;
}

/* Textarea styling - FORCE visible text in all modes */
html[data-theme="light"] .forum-textarea,
html:not([data-theme="dark"]) .forum-textarea {
  background-color: var(--input-bg) !important;
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
