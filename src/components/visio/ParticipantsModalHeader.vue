<template>
  <!-- Header -->
  <div class="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Left: Titre et enseignant -->
      <div>
        <h3 class="text-xl font-bold flex items-center">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Liste de Présence
        </h3>
        <p v-if="teacher && teacher.nom" class="text-sm font-normal opacity-90 mt-1">
          Enseignant: {{ teacher.prenom ? teacher.prenom + ' ' : '' }}{{ teacher.nom }}
        </p>
      </div>

      <!-- Center: Durée de la séance -->
      <div class="text-center flex-1">
        <p class="text-sm opacity-90">Séance</p>
        <p class="text-lg font-semibold mt-1">
          <i class="fa fa-clock-o mr-2"></i>{{ seanceTime }}
        </p>
        <p class="text-2xl font-bold mt-1">({{ seanceDuration }})</p>
      </div>

      <!-- Right: Coordinateur et bouton fermer -->
      <div class="text-right flex items-start gap-4">
        <div v-if="coordinator && coordinator.nom">
          <p class="text-sm font-normal opacity-90">Coordinateur:</p>
          <p class="text-sm font-semibold">{{ coordinator.prenom ? coordinator.prenom + ' ' : '' }}{{ coordinator.nom }}</p>
        </div>
        <button @click="$emit('close')" class="text-white hover:text-gray-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tête présentationnel de ParticipantsModal (#H13 ≤300) : titre, enseignant,
 * horaire/durée de séance, coordinateur et bouton fermer. Aucune logique ;
 * émet `close`. Markup/classes Tailwind déplacés VERBATIM.
 */
defineProps({
  teacher: { type: Object, default: null },
  coordinator: { type: Object, default: null },
  seanceTime: { type: String, default: null },
  seanceDuration: { type: String, default: '' },
})
defineEmits(['close'])
</script>
