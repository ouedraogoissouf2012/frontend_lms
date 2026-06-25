<template>
  <!-- Statistiques -->
  <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
    <!-- Total étudiants -->
    <div class="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-blue-600 font-medium">Total</p>
          <p class="text-2xl font-bold text-blue-900">{{ stats.total_students }}</p>
        </div>
        <svg class="w-10 h-10 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      </div>
    </div>

    <!-- Présents -->
    <div class="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-green-600 font-medium">Présents</p>
          <p class="text-2xl font-bold text-green-900">{{ stats.present_count }}</p>
          <p v-if="stats.visio_status === 'terminee'" class="text-xs text-green-600 mt-1">{{ stats.presence_rate }}%</p>
          <p v-else class="text-xs text-green-500 mt-1 italic">En cours...</p>
        </div>
        <svg class="w-10 h-10 text-green-300" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- Absents -->
    <div class="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-red-600 font-medium">Absents</p>
          <p class="text-2xl font-bold text-red-900">{{ stats.absent_count }}</p>
        </div>
        <svg class="w-10 h-10 text-red-300" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- Retards -->
    <div class="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-orange-600 font-medium">Retards</p>
          <p class="text-2xl font-bold text-orange-900">{{ stats.late_count }}</p>
        </div>
        <svg class="w-10 h-10 text-orange-300" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- Durée moyenne -->
    <div class="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-purple-600 font-medium">Durée moy.</p>
          <p class="text-2xl font-bold text-purple-900">{{ formatDuration(stats.average_duration_minutes) }}</p>
          <p v-if="stats.visio_status === 'terminee'" class="text-xs text-purple-600 mt-1">{{ stats.average_percentage }}%</p>
          <p v-else class="text-xs text-purple-500 mt-1 italic">En cours...</p>
        </div>
        <svg class="w-10 h-10 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes de statistiques présentationnelles de ParticipantsModal (#H13 ≤300) :
 * Total / Présents / Absents / Retards / Durée moyenne. Aucune logique ;
 * `formatDuration` est injecté en prop (fonction pure du composable) afin de
 * préserver le formatage VERBATIM de l'original. Markup/classes déplacés VERBATIM.
 */
defineProps({
  stats: { type: Object, required: true },
  formatDuration: { type: Function, required: true },
})
</script>
