<template>
  <div>
    <div v-if="seances && seances.length > 0" class="space-y-4">
      <div
        v-for="seance in seances"
        :key="seance.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
        @click="$emit('view-seance', seance.id)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ formatDate(seance.programmation?.date) }} • Séance #{{ seance.id }}
              </h3>
              <span
                v-if="seance.visio_enabled"
                class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Visio {{ seance.visio_type }}
              </span>
            </div>

            <p class="flex items-center gap-2 text-gray-600 mt-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
              <span class="text-gray-400">({{ calculateSeanceDuration(seance) }} min)</span>
            </p>

            <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                fa-user {{ seance.enseignant?.nom || 'Enseignant non assigné' }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {{ seance.classe?.nom || 'Non assigné' }}
              </span>
              <span v-if="seance.programmation?.salle" class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ seance.programmation.salle }}
              </span>
            </div>

            <!-- Statut -->
            <div class="mt-2">
              <span :class="['px-2 py-1 text-xs rounded', getSeanceStatusClass(seance)]">
                {{ getSeanceStatusLabel(seance) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- VisioManager: Gestion complète de la visio -->
            <VisioManager :seance="seance" @visio-updated="$emit('visio-updated')" />

            <!-- Bouton Masquer (étudiants uniquement) -->
            <button
              v-if="!isTeacher"
              @click.stop="$emit('hide-seance', seance)"
              class="px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2"
              title="Masquer cette séance de ma liste"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              Masquer
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <p>Aucune séance programmée pour cette matière</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Onglet « Séances » des détails matière (#28, tranche 2).
 * Sous-composant de présentation extrait de MatiereDetails.vue.
 * Émet view-seance / hide-seance / visio-updated ; la logique reste au parent.
 * (Markup Tailwind : aucune CSS scopée à migrer.)
 */
import VisioManager from '@/components/visio/VisioManager.vue'
import { getSeanceStatusClass, getSeanceStatusLabel, calculateSeanceDuration } from '@/utils/matiereDetails'
import { formatDateWeekday, formatTime as fmtTime } from '@/utils/formatters'

defineProps({
  seances: { type: Array, default: () => [] },
  isTeacher: { type: Boolean, default: false }
})

defineEmits(['view-seance', 'hide-seance', 'visio-updated'])

// #283 : formatage délégué aux canoniques ; doubles-replis (null vs invalide) conservés.
function formatDate(date) {
  if (!date) return 'Non défini'
  if (Number.isNaN(new Date(date).getTime())) return 'Date invalide'
  return formatDateWeekday(date)
}

function formatTime(isoTimestamp) {
  if (!isoTimestamp) return 'N/A'
  if (Number.isNaN(new Date(isoTimestamp).getTime())) return '--:--'
  return fmtTime(isoTimestamp)
}
</script>
