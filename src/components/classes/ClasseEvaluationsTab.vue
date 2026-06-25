<template>
  <div>
    <div v-if="evaluations && evaluations.length > 0" class="space-y-4">
      <div
        v-for="evaluation in evaluations"
        :key="evaluation.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
        @click="$emit('view-evaluation', evaluation.id)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">{{ evaluation.titre }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ evaluation.matiere?.nom }}</p>

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
              <span :class="[
                'px-2 py-1 text-xs rounded',
                getEvaluationStatusClass(evaluation.programmation.window)
              ]">
                {{ getEvaluationStatusLabel(evaluation.programmation.window) }}
              </span>
            </div>
          </div>

          <button class="text-green-600 hover:text-green-800">
            →
          </button>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-12 text-gray-500">
      <p>Aucune évaluation programmée pour cette classe</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Onglet Évaluations de ClasseDetails (#H9 ≤300). Présentation pure : liste des
 * évaluations programmées ; émet `view-evaluation` au clic. Le formatage (date,
 * statut de fenêtre) provient des fonctions pures de `utils/classeDetails`. Le
 * style (badges, bordures, couleurs) est centralisé dans la vue parente via `:deep()`.
 */
import { formatDate, getEvaluationStatusClass, getEvaluationStatusLabel } from '@/utils/classeDetails'

defineProps({
  evaluations: { type: Array, default: () => [] }
})
defineEmits(['view-evaluation'])
</script>
