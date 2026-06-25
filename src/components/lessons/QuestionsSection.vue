<template>
  <div class="form-section">
    <div class="section-header">
      <h4 class="section-title">Questions ({{ questions.length }})</h4>
    </div>

    <div v-if="questions.length === 0" class="empty-questions">
      <i class="material-icons">help_outline</i>
      <p>Aucune question. Cliquez sur "Ajouter une question" pour commencer.</p>
    </div>

    <draggable
      v-else
      v-model="questions"
      item-key="index"
      handle=".drag-handle"
      ghost-class="ghost-question"
    >
      <template #item="{ element: question, index }">
        <QuestionEditorCard
          :question="question"
          :index="index"
          @remove="$emit('remove-question', index)"
        />
      </template>
    </draggable>

    <!-- Bouton Ajouter en bas -->
    <div class="add-question-section">
      <button @click="$emit('add-question')" class="add-question-btn">
        <i class="material-icons">add</i>
        Ajouter une question
      </button>
    </div>

    <!-- Aide validation -->
    <div v-if="questions.length > 0 && !isValid" class="validation-help">
      <i class="material-icons">info</i>
      <span>Assurez-vous de selectionner la bonne reponse pour chaque question (cochez le cercle a gauche)</span>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Questions » de KnowledgeCheckEditor (#G6 ; éclaté sous 300 lignes en
 * H5). Sous-composant présentationnel : état vide, liste triable (vuedraggable)
 * de QuestionEditorCard, bouton d'ajout et aide de validation. La liste est liée
 * en v-model (le glisser-déposer réordonne le tableau du parent) ; ajout et
 * suppression sont émis au parent (composable useKnowledgeCheckEditor).
 */
import draggable from 'vuedraggable'
import QuestionEditorCard from '@/components/lessons/QuestionEditorCard.vue'

const questions = defineModel('questions', { type: Array, default: () => [] })

defineProps({
  isValid: { type: Boolean, default: false }
})

defineEmits(['add-question', 'remove-question'])
</script>

<style scoped>
.form-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.section-header .section-title {
  margin: 0;
}

.add-question-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.add-question-btn:hover {
  background: #4f46e5;
}

.add-question-section {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  margin-top: 0.5rem;
}

.add-question-section .add-question-btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
}

.validation-help {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #b45309;
  font-size: 0.8125rem;
  margin-top: 1rem;
}

.validation-help i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.empty-questions {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-questions i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}
</style>
