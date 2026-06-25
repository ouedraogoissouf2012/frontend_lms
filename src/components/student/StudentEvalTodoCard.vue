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
      <span :class="['evaluation-status', getStatusClass(evaluation)]">
        {{ getStatusLabel(evaluation) }}
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
      <div class="detail-item">
        <DocumentTextIcon class="detail-icon" />
        <span>Coef. {{ evaluation.programmation?.coefficient || evaluation.coefficient || 1 }}</span>
      </div>
      <div class="detail-item" v-if="evaluation.questions_count">
        <span>{{ evaluation.questions_count }} questions</span>
      </div>
    </div>

    <!-- Fenêtre temporelle -->
    <div v-if="evaluation.programmation?.window" class="window-info" :class="getWindowClass(evaluation)">
      <ClockIcon class="w-4 h-4" />
      <span v-if="!evaluation.programmation.window.has_started">
        Ouvrira le {{ formatDateTime(evaluation.programmation.window.start_at) }}
      </span>
      <span v-else-if="evaluation.programmation.window.is_open">
        Disponible jusqu'au {{ formatDateTime(evaluation.programmation.window.end_at) }}
        <strong v-if="evaluation.programmation.window.time_left_minutes">
          ({{ evaluation.programmation.window.time_left_minutes }} min restantes)
        </strong>
      </span>
    </div>

    <!-- En cours -->
    <div v-if="evaluation.student_submission?.status === 'en_cours'" class="submission-info submission-ongoing">
      <i class="fa fa-spinner fa-spin"></i>
      <span>Tentative en cours - reprenez là où vous en étiez</span>
    </div>

    <div class="evaluation-actions">
      <button
        v-if="evaluation.student_submission?.status === 'en_cours'"
        @click="$emit('continue', evaluation)"
        class="btn-action btn-continue"
      >
        <PlayIcon class="w-5 h-5" />
        Continuer l'évaluation
      </button>
      <button
        v-else-if="isWindowOpen(evaluation)"
        @click="$emit('start', evaluation)"
        class="btn-action btn-start"
      >
        <PlayIcon class="w-5 h-5" />
        Commencer l'évaluation
      </button>
      <button
        v-else
        disabled
        class="btn-action btn-disabled"
      >
        <ClockIcon class="w-5 h-5" />
        Pas encore disponible
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte « évaluation à faire » (H2 ≤300). Section présentationnelle extraite
 * verbatim de StudentEvaluationsList.vue : reçoit l'évaluation en prop et émet
 * `start` / `continue`. Statut/format = utils/studentEvaluationStatus (purs).
 * CSS = partial partagé @use'd (chrome de carte byte-identique).
 */
import { CalendarIcon, ClockIcon, DocumentTextIcon, PlayIcon } from '@heroicons/vue/24/outline'
import {
  getStatusLabel,
  getStatusClass,
  getWindowClass,
  isWindowOpen,
  formatDate,
  formatDateTime
} from '@/utils/studentEvaluationStatus'

defineProps({
  evaluation: { type: Object, required: true }
})

defineEmits(['start', 'continue'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/student-eval-card';
</style>
