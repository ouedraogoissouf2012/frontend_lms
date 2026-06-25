<template>
  <div class="evaluation-card">
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
      <span class="evaluation-status status-completed">
        Terminée
      </span>
    </div>

    <div class="evaluation-details">
      <div class="detail-item">
        <CalendarIcon class="detail-icon" />
        <span>{{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}</span>
      </div>
      <div class="detail-item">
        <span class="note-badge" :class="getNoteClass(evaluation.student_submission?.note_sur_20)">
          {{ evaluation.student_submission?.note_sur_20 ?? '-' }}/20
        </span>
      </div>
    </div>

    <div class="evaluation-actions">
      <button
        @click="$emit('view-results', evaluation)"
        class="btn-action btn-results"
      >
        <EyeIcon class="w-5 h-5" />
        Voir mes résultats
      </button>
      <button
        @click="$emit('start', evaluation)"
        class="btn-action btn-practice"
      >
        <ArrowPathIcon class="w-5 h-5" />
        S'entraîner
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte « évaluation terminée » (H2 ≤300). Section présentationnelle extraite
 * verbatim de StudentEvaluationsList.vue : reçoit l'évaluation en prop et émet
 * `view-results` / `start` (s'entraîner). Note/format = utils/studentEvaluationStatus.
 * CSS = partial partagé @use'd (chrome de carte byte-identique).
 */
import { CalendarIcon, EyeIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { formatDate, getNoteClass } from '@/utils/studentEvaluationStatus'

defineProps({
  evaluation: { type: Object, required: true }
})

defineEmits(['view-results', 'start'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/student-eval-card';
</style>
