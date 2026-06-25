<template>
  <div class="evaluation-card card-practice">
    <div class="evaluation-header">
      <div class="evaluation-info">
        <h3 class="evaluation-title">{{ evaluation.titre || 'Évaluation' }}</h3>
        <p class="evaluation-matiere">
          {{ evaluation.matiere?.nom || evaluation.matiere_nom || 'Matière' }}
          <span v-if="evaluation.classe?.nom || evaluation.classe?.libelle || evaluation.classe_nom">
             - {{ evaluation.classe?.nom || evaluation.classe?.libelle || evaluation.classe_nom }}
          </span>
        </p>
      </div>
      <span class="evaluation-status status-practice">
        Entraînement
      </span>
    </div>

    <div class="evaluation-details">
      <div class="detail-item">
        <CalendarIcon class="detail-icon" />
        <span>{{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}</span>
      </div>
      <div class="detail-item" v-if="evaluation.duree_minutes">
        <ClockIcon class="detail-icon" />
        <span>{{ evaluation.duree_minutes }} min</span>
      </div>
      <div class="detail-item" v-if="evaluation.questions_count">
        <span>{{ evaluation.questions_count }} questions</span>
      </div>
    </div>

    <div class="evaluation-actions">
      <button
        @click="$emit('start', evaluation)"
        class="btn-action btn-practice"
      >
        <PlayIcon class="w-5 h-5" />
        S'entraîner
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte « s'entraîner » (H2 ≤300). Section présentationnelle extraite verbatim
 * de StudentEvaluationsList.vue : évaluations passées sans soumission terminée.
 * Reçoit l'évaluation en prop, émet `start`. Format = utils/studentEvaluationStatus.
 * CSS = partial partagé @use'd (chrome de carte byte-identique).
 */
import { CalendarIcon, ClockIcon, PlayIcon } from '@heroicons/vue/24/outline'
import { formatDate } from '@/utils/studentEvaluationStatus'

defineProps({
  evaluation: { type: Object, required: true }
})

defineEmits(['start'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/student-eval-card';
</style>
