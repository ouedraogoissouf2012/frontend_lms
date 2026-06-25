<template>
  <div class="bg-white shadow rounded-lg p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Séances à venir (30 jours)</h2>

    <div v-if="seances && seances.length > 0" class="space-y-4">
      <div
        v-for="seance in seances"
        :key="seance.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">{{ seance.matiere?.nom }}</h3>

            <p class="flex items-center gap-2 text-gray-600 mt-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ formatDate(seance.programmation?.date) }} | {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
              <span class="text-gray-400">({{ calculateDuration(seance) }} min)</span>
            </p>

            <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ seance.enseignant?.nom || 'Non assigné' }}
              </span>
              <span v-if="seance.salle" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ seance.salle }}
              </span>
            </div>

            <!-- Badge visio si activé -->
            <div v-if="seance.visio_enabled" class="mt-2">
              <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center gap-1 inline-flex">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Visio {{ seance.visio_type }} activée
              </span>
            </div>
          </div>

          <!-- VisioManager: Gestion complète de la visio -->
          <VisioManager :seance="seance" @visio-updated="$emit('refresh')" />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <p>Aucune séance programmée pour les 30 prochains jours</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Séances à venir (30 jours) » de ClasseDetails (#H9 ≤300).
 * Présentation pure : liste des séances + VisioManager. Le formatage vient des
 * fonctions pures de `utils/classeDetails`. Relaie `visio-updated` en `refresh`
 * pour que la vue recharge les séances. Style centralisé dans la vue via `:deep()`.
 */
import VisioManager from '@/components/visio/VisioManager.vue'
import { formatDate, formatTime, calculateDuration } from '@/utils/classeDetails'

defineProps({
  seances: { type: Array, default: () => [] }
})
defineEmits(['refresh'])
</script>
