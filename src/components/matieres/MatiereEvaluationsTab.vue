<template>
  <div>
    <div v-if="evaluations && evaluations.length > 0" class="space-y-4">
      <div
        v-for="evaluation in evaluations"
        :key="evaluation.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
        @click="$emit('view-evaluation', evaluation)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">{{ evaluation.titre }}</h3>

            <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(evaluation.programmation?.date_evaluation) }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ evaluation.duree_minutes }} min
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Coef: {{ evaluation.programmation?.coefficient || 1 }}
              </span>
            </div>

            <!-- Fenêtre temporelle -->
            <div v-if="evaluation.programmation?.window" class="mt-2">
              <span :class="['px-2 py-1 text-xs rounded', getEvaluationStatusClass(evaluation.programmation.window)]">
                {{ getEvaluationStatusLabel(evaluation.programmation.window) }}
              </span>
            </div>
          </div>

          <button class="text-blue-600 hover:text-blue-800">
            →
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <p>Aucune évaluation programmée pour cette matière</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Onglet « Évaluations » des détails matière (#28, tranche 2).
 * Sous-composant de présentation extrait de MatiereDetails.vue.
 * Émet view-evaluation ; la logique reste au parent. (Markup Tailwind, pas de CSS.)
 */
import { getEvaluationStatusClass, getEvaluationStatusLabel } from '@/utils/matiereDetails'
import { formatDateWeekday } from '@/utils/formatters'

defineProps({
  evaluations: { type: Array, default: () => [] }
})

defineEmits(['view-evaluation'])

// #283 : formatage délégué au canonique ; double-repli (null vs date invalide) conservé.
function formatDate(date) {
  if (!date) return 'Non défini'
  if (Number.isNaN(new Date(date).getTime())) return 'Date invalide'
  return formatDateWeekday(date)
}
</script>
