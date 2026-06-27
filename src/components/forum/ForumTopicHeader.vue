<template>
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
</template>

<script setup>
/**
 * En-tête présentationnel du sujet (#G1 ≤300). Affiche titre, badges d'état
 * (épinglé/fermé/résolu), contenu et méta (auteur/date/vues). Aucune logique :
 * `topic` et la fonction de formatage de date arrivent en props.
 */
defineProps({
  topic: { type: Object, required: true },
  formatDate: { type: Function, required: true },
})
</script>

<style scoped>
/* Force proper backgrounds for BOTH modes - Using data-theme attribute */
html[data-theme="light"] .light-mode-card,
html:not([data-theme="dark"]) .light-mode-card {
  background-color: var(--card-bg) !important;
}

html[data-theme="dark"] .light-mode-card {
  background-color: #1f2937 !important;
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
