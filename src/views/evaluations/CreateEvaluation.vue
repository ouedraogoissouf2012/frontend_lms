<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4">
      <!-- En-tête -->
      <div class="mb-8">
        <button
          @click="goBack"
          class="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Retour
        </button>
        <h1 class="text-3xl font-bold text-gray-900">Créer version en ligne</h1>
        <p class="text-gray-600 mt-2">Ajoutez des questions QCM pour l'évaluation en ligne</p>
        <div v-if="evaluationKlassci" class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm font-medium text-blue-900">Évaluation KLASSCI : {{ evaluationKlassci.titre }}</p>
          <p class="text-sm text-blue-700 mt-1">
            {{ evaluationKlassci.matiere?.name }} - {{ evaluationKlassci.classe?.libelle }}
          </p>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
        <!-- Informations de base -->
        <EvaluationInfoForm :evaluation="evaluation" :matieres="matieres" :classes="classes" />

        <!-- Questions -->
        <QuestionsList
          :questions="questions"
          @add="addQuestion"
          @remove="removeQuestion"
          @add-option="addOption"
          @remove-option="removeOption"
          @set-correct="setCorrectAnswer"
          @toggle-correct="toggleCorrectAnswer"
        />

        <!-- Actions -->
        <div class="flex gap-4 pt-6 border-t">
          <button
            @click="saveAsDraft"
            type="button"
            :disabled="loading"
            class="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            {{ loading ? 'Enregistrement...' : 'Enregistrer comme brouillon' }}
          </button>
          <button
            @click="saveAndPublish"
            type="button"
            :disabled="loading || !isValid"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            {{ loading ? 'Publication...' : 'Publier l\'évaluation' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Création d'une évaluation en ligne (H1 ≤300). Orchestrateur : la donnée et la
 * logique vivent dans useCreateEvaluation ; l'UI est composée de
 * EvaluationInfoForm et QuestionsList. Comportement/rendu identiques à l'original.
 */
import EvaluationInfoForm from '@/components/evaluations/EvaluationInfoForm.vue'
import QuestionsList from '@/components/evaluations/QuestionsList.vue'
import { useCreateEvaluation } from '@/composables/useCreateEvaluation'

const {
  evaluation, evaluationKlassci, questions, matieres, classes, loading,
  isValid,
  addQuestion, removeQuestion, addOption, removeOption,
  setCorrectAnswer, toggleCorrectAnswer,
  saveAsDraft, saveAndPublish, goBack,
} = useCreateEvaluation()
</script>
