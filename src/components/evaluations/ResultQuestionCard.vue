<template>
  <div class="bg-card rounded-lg shadow-md p-6">
    <!-- En-tête de question -->
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Question {{ index + 1 }}
          </span>
          <span class="text-secondary text-sm">{{ question.points }} point(s)</span>
          <span
            v-if="correctionAvailable"
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium',
              isCorrect(question, answers) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]"
          >
            {{ isCorrect(question, answers) ? 'fa-check Correct' : '✗ Incorrect' }}
          </span>
          <span
            v-else
            class="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary"
          >
            fa-circle En attente de correction
          </span>
        </div>
        <p class="text-lg text-primary">{{ question.question }}</p>
      </div>
    </div>

    <!-- QCM / QCM multiple / Vrai-Faux -->
    <ResultChoiceOptions
      v-if="['qcm', 'qcm_multiple', 'vrai_faux'].includes(question.type)"
      :question="question"
      :answers="answers"
      :correction-available="correctionAvailable"
    />

    <!-- Réponse courte -->
    <div v-else-if="question.type === 'reponse_courte'">
      <div class="space-y-3">
        <div class="p-3 bg-tertiary rounded-lg border border-gray-200">
          <p class="text-sm text-secondary mb-1">Votre réponse :</p>
          <p class="text-primary">{{ getStudentAnswer(answers, question) || 'Aucune réponse' }}</p>
        </div>
        <div v-if="correctionAvailable && question.correct_answers && question.correct_answers.length > 0" class="p-3 bg-green-50 rounded-lg border border-green-200">
          <p class="text-sm text-green-800 mb-1">Réponse(s) attendue(s) :</p>
          <ul class="list-disc list-inside text-green-900">
            <li v-for="(answer, idx) in question.correct_answers" :key="idx">{{ answer }}</li>
          </ul>
        </div>
        <div v-else-if="!correctionAvailable" class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p class="text-sm text-yellow-800">
            fa-circle La correction sera disponible dans {{ daysUntilCorrection }} jour(s)
          </p>
        </div>
      </div>
    </div>

    <!-- Dissertation -->
    <div v-else-if="question.type === 'dissertation'">
      <div class="p-3 bg-tertiary rounded-lg border border-gray-200">
        <p class="text-sm text-secondary mb-2">Votre réponse :</p>
        <p class="text-primary whitespace-pre-wrap">{{ getStudentAnswer(answers, question) || 'Aucune réponse' }}</p>
      </div>
    </div>

    <!-- Explication (si disponible ET correction disponible) -->
    <div v-if="correctionAvailable && question.explanation" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <p class="text-sm font-medium text-blue-900 mb-1">
        <svg class="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>
        Explication
      </p>
      <p class="text-blue-800 text-sm">{{ question.explanation }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte d'une question corrigée de EvaluationResults (H2 ≤300) : en-tête (numéro,
 * points, statut correct/attente) + dispatch par type (choix → ResultChoiceOptions,
 * réponse courte / dissertation inline) + explication. Section présentationnelle
 * extraite verbatim ; logique d'exactitude dans utils/evaluationResultAnswers (pure).
 */
import ResultChoiceOptions from '@/components/evaluations/ResultChoiceOptions.vue'
import { isCorrect, getStudentAnswer } from '@/utils/evaluationResultAnswers'

defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
  answers: { type: Object, default: () => ({}) },
  correctionAvailable: { type: Boolean, default: false },
  daysUntilCorrection: { type: Number, default: 0 }
})
</script>

<style scoped lang="scss">
@use '../../assets/styles/eval-results-theme';
</style>
