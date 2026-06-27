<template>
  <div class="knowledge-check-editor">
    <!-- Header -->
    <div class="editor-header">
      <h3 class="editor-title">
        <i class="material-icons">quiz</i>
        {{ isEditing ? 'Modifier le quiz' : 'Nouveau quiz' }}
      </h3>
      <button @click="$emit('close')" class="close-btn">
        <i class="material-icons">close</i>
      </button>
    </div>

    <!-- Form -->
    <div class="editor-content">
      <!-- Informations generales -->
      <div class="form-section">
        <h4 class="section-title">Informations generales</h4>

        <div class="form-group">
          <label>Titre du quiz *</label>
          <input
            v-model="quiz.title"
            type="text"
            placeholder="Ex: Testez vos connaissances - Chapitre 1"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>Description (optionnel)</label>
          <textarea
            v-model="quiz.description"
            rows="2"
            placeholder="Description courte du quiz..."
            class="form-input"
          ></textarea>
        </div>
      </div>

      <!-- Questions (#G6 : extrait en sous-composant) -->
      <QuestionsSection
        v-model:questions="quiz.questions"
        :is-valid="isValid"
        @add-question="addQuestion"
        @remove-question="removeQuestion"
      />

      <!-- Configuration (#G6 : extrait en sous-composant) -->
      <QuizConfigForm :quiz="quiz" />
    </div>

    <!-- Footer -->
    <div class="editor-footer">
      <button @click="$emit('close')" class="cancel-btn">
        Annuler
      </button>
      <button @click="save" :disabled="!isValid || saving" class="save-btn">
        <i class="material-icons spinning" v-if="saving">sync</i>
        <i class="material-icons" v-else>save</i>
        {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Éditeur de quiz « Testez vos connaissances » (#G6 ; éclaté sous 300 lignes en
 * H5). Orchestrateur : l'état et la logique du quiz vivent dans
 * useKnowledgeCheckEditor ; les questions (QuestionsSection → QuestionEditorCard)
 * et la configuration (QuizConfigForm) sont des sous-composants. Ce composant ne
 * garde que l'en-tête, la saisie des infos générales et le pied de page.
 */
import QuestionsSection from '@/components/lessons/QuestionsSection.vue'
import QuizConfigForm from '@/components/lessons/QuizConfigForm.vue'
import { useKnowledgeCheckEditor } from '@/composables/useKnowledgeCheckEditor'

const props = defineProps({
  chapterId: {
    type: Number,
    required: true
  },
  existingQuiz: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const { saving, isEditing, quiz, isValid, addQuestion, removeQuestion, save } =
  useKnowledgeCheckEditor(props, emit)
</script>

<style scoped>
.knowledge-check-editor {
  background: var(--bg-primary);
  border-radius: 12px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.editor-title i {
  color: var(--indigo-500);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.9375rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--indigo-500);
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.cancel-btn {
  padding: 0.625rem 1.25rem;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: var(--bg-tertiary);
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  background: var(--indigo-500);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: var(--indigo-600);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn i {
  font-size: 1.125rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.save-btn i.spinning {
  animation: spin 1s linear infinite;
}
</style>
