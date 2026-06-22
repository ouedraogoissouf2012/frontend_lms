<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuration</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Durée (minutes) *
        </label>
        <input
          v-model.number="configuration.duree_minutes"
          type="number"
          min="1"
          class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tentatives autorisées
        </label>
        <input
          v-model.number="configuration.max_attempts"
          type="number"
          min="1"
          max="5"
          class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
        />
      </div>
    </div>

    <div class="mt-4 space-y-2">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="configuration.shuffle_questions"
          type="checkbox"
          class="rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">Mélanger les questions</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="configuration.show_results"
          type="checkbox"
          class="rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">Afficher les résultats immédiatement</span>
      </label>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Configuration » de CreateQuestions (H1) : durée, tentatives et
 * options (mélange, résultats). Présentation pure liée au modèle réactif
 * `configuration` partagé. CSS = Tailwind inline, identique à l'original.
 */
defineProps({
  configuration: { type: Object, required: true }
})
</script>
