<template>
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
          @click="$emit('mark-solution', post.id)"
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
</template>

<script setup>
/**
 * Liste présentationnelle des réponses d'un sujet (#G1 ≤300). Affiche chaque
 * post (badge solution/édité, auteur, date), le bouton « Marquer comme solution »
 * (visibilité décidée par `canMarkAsSolution` reçu en prop) et l'état vide.
 * Émet `mark-solution` avec l'id du post ; aucun appel API direct.
 */
defineProps({
  topic: { type: Object, required: true },
  formatDate: { type: Function, required: true },
  canMarkAsSolution: { type: Function, required: true },
})

defineEmits(['mark-solution'])
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
