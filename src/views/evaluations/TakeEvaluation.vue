<template>
  <DashboardLayout>
    <div class="take-evaluation-container">
      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement de l'évaluation..." />

      <!-- Évaluation chargée -->
      <template v-else-if="evaluation">
        <TakeEvaluationBanners
          :is-practice="isPractice"
          :window-time-left="windowTimeLeft"
          :format-time-left="formatTimeLeft"
        />

        <TakeEvaluationHeader
          :evaluation="evaluation"
          :time-remaining="timeRemaining"
          :answered-count="answeredCount"
          :progress-percentage="progressPercentage"
          :format-time="formatTime"
        />

        <!-- Questions -->
        <div class="questions-list">
          <TakeQuestionCard
            v-for="(question, index) in evaluation.questions"
            :key="question.id"
            :question="question"
            :index="index"
            :answers="answers"
            :is-answered="isAnswered"
            :is-option-selected="isOptionSelected"
            @toggle-multiple="toggleMultipleChoice"
          />
        </div>

        <TakeEvaluationActions
          :submitting="submitting"
          :is-practice="isPractice"
          @cancel="confirmCancel"
          @submit="confirmSubmit"
        />
      </template>

      <!-- Erreur -->
      <div v-else class="error-state">
        <i class="fa fa-exclamation-circle error-icon"></i>
        <p class="error-text">{{ error || 'Impossible de charger l\'évaluation' }}</p>
        <button @click="$router.back()" class="btn-back-error">
          <i class="fa fa-arrow-left"></i>
          Retour
        </button>
      </div>

      <!-- Modales (confirmation + résultats) -->
      <TakeResultModals
        v-if="evaluation"
        :show-confirm-modal="showConfirmModal"
        :show-results-modal="showResultsModal"
        :evaluation="evaluation"
        :answered-count="answeredCount"
        :results="results"
        :is-practice="isPractice"
        @close-confirm="showConfirmModal = false"
        @submit="submitEvaluation"
        @return="returnToEvaluations"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Passage d'une évaluation côté étudiant (H1 ≤300). Orchestrateur : la donnée et
 * la logique vivent dans useTakeEvaluation ; l'UI est composée de
 * TakeEvaluationBanners, TakeEvaluationHeader, TakeQuestionCard,
 * TakeEvaluationActions et TakeResultModals. Rendu/comportement identiques à
 * l'original.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import TakeEvaluationBanners from '@/components/evaluations/TakeEvaluationBanners.vue'
import TakeEvaluationHeader from '@/components/evaluations/TakeEvaluationHeader.vue'
import TakeQuestionCard from '@/components/evaluations/TakeQuestionCard.vue'
import TakeEvaluationActions from '@/components/evaluations/TakeEvaluationActions.vue'
import TakeResultModals from '@/components/evaluations/TakeResultModals.vue'
import { useTakeEvaluation } from '@/composables/useTakeEvaluation'

const {
  evaluation, answers, loading, submitting, error,
  timeRemaining, windowTimeLeft,
  showConfirmModal, showResultsModal, results, isPractice,
  answeredCount, progressPercentage,
  formatTime, formatTimeLeft,
  isAnswered, isOptionSelected, toggleMultipleChoice,
  confirmCancel, confirmSubmit, submitEvaluation, returnToEvaluations,
} = useTakeEvaluation()
</script>

<style scoped>
.take-evaluation-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0;
}

/* Questions */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

/* Error state */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.error-icon {
  font-size: 3rem;
  color: var(--red-500);
  margin-bottom: 1rem;
}

.error-text {
  font-size: 1.125rem;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

.btn-back-error {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--red-500);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-error:hover {
  background: var(--red-600);
}
</style>
