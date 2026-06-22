<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-900">Questions</h2>
      <button
        @click="$emit('add')"
        type="button"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Ajouter une question
      </button>
    </div>

    <!-- Liste des questions -->
    <div class="space-y-4">
      <QuestionEditor
        v-for="(question, index) in questions"
        :key="index"
        :question="question"
        :index="index"
        @remove="$emit('remove', index)"
        @add-option="$emit('add-option', index)"
        @remove-option="(optIndex) => $emit('remove-option', index, optIndex)"
        @set-correct="(option) => $emit('set-correct', index, option)"
        @toggle-correct="(option) => $emit('toggle-correct', index, option)"
      />

      <div v-if="questions.length === 0" class="text-center py-8 text-gray-500">
        Aucune question ajoutée. Cliquez sur "Ajouter une question" pour commencer.
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Questions » (H1) : en-tête + bouton d'ajout, liste de QuestionEditor
 * et état vide. Relaie chaque action de question au parent en y joignant l'index,
 * pour que le composable applique la mutation sur le tableau `questions`.
 */
import QuestionEditor from './QuestionEditor.vue'

defineProps({
  questions: { type: Array, default: () => [] }
})

defineEmits(['add', 'remove', 'add-option', 'remove-option', 'set-correct', 'toggle-correct'])
</script>
