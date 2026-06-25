<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <div class="max-w-5xl mx-auto">
      <!-- En-tête -->
      <div class="mb-8">
        <button
          @click="goBack"
          class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 flex items-center gap-2 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Retour
        </button>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ isEditMode ? 'Modifier les questions QCM' : 'Créer les questions QCM' }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          {{ isEditMode ? 'Modifiez les questions de l\'évaluation en ligne' : 'Ajoutez les questions pour l\'évaluation en ligne' }}
        </p>

        <!-- Infos évaluation KLASSCI -->
        <div v-if="evaluationKlassci" class="mt-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">Évaluation</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ evaluationKlassci.titre }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">Matière</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ evaluationKlassci.matiere?.nom || evaluationKlassci.matiere?.name }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">Classe</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ evaluationKlassci.classe?.nom || evaluationKlassci.classe?.name || evaluationKlassci.classe?.libelle }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-600 dark:text-blue-400">Barème</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ evaluationKlassci.bareme || evaluationKlassci.programmation?.bareme || 20 }}/20</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700">
        <!-- Configuration -->
        <QuestionsConfigForm :configuration="configuration" />

        <!-- Questions -->
        <QuestionsEditorList
          :questions="questions"
          @add="addQuestion"
          @remove="removeQuestion"
          @add-option="addOption"
          @remove-option="removeOption"
          @set-correct="setCorrectAnswer"
          @toggle-correct="toggleCorrectAnswer"
        />

        <!-- Actions -->
        <div class="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="saveQuestions"
            type="button"
            :disabled="loading || !isValid"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {{ loading ? 'Enregistrement...' : (isEditMode ? 'Enregistrer les modifications' : 'Enregistrer et activer') }}
          </button>
        </div>
      </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Création / édition des questions QCM d'une évaluation en ligne (H1 ≤300).
 * Orchestrateur : la donnée et la logique vivent dans useCreateQuestions ; l'UI
 * est composée de QuestionsConfigForm et QuestionsEditorList. Rendu/comportement
 * identiques à l'original.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import QuestionsConfigForm from '@/components/evaluations/QuestionsConfigForm.vue'
import QuestionsEditorList from '@/components/evaluations/QuestionsEditorList.vue'
import { useCreateQuestions } from '@/composables/useCreateQuestions'

const {
  evaluationKlassci, configuration, questions, loading, isEditMode,
  isValid,
  addQuestion, removeQuestion, addOption, removeOption,
  setCorrectAnswer, toggleCorrectAnswer,
  saveQuestions, goBack,
} = useCreateQuestions()
</script>

<style scoped>
.dashboard-content {
  padding: 2rem;
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
  }
}
</style>
