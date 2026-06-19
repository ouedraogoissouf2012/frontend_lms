<template>
  <div>
    <div v-if="classes && classes.length > 0" class="space-y-4">
      <div
        v-for="classe in classes"
        :key="classe.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
        @click="$emit('view-classe', classe.id)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">{{ classe.nom }}</h3>

            <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span class="flex items-center gap-1" v-if="classe.filiere">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {{ classe.filiere.nom }}
              </span>
              <span class="flex items-center gap-1" v-if="classe.niveau">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {{ classe.niveau.nom }}
              </span>
              <span class="flex items-center gap-1" v-if="classe.effectif">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {{ classe.effectif }} étudiants
              </span>
            </div>
          </div>

          <button class="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            Voir détails →
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <p>Aucune classe ne suit cette matière</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Onglet « Classes » des détails matière (#28, tranche 2).
 * Sous-composant de présentation extrait de MatiereDetails.vue.
 * Émet view-classe ; la navigation reste au parent. (Markup Tailwind, pas de CSS.)
 */
defineProps({
  classes: { type: Array, default: () => [] }
})

defineEmits(['view-classe'])
</script>
