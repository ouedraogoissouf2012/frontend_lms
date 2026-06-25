<template>
  <div class="quiz-editor-inline">
    <div v-if="chapter.id" class="quiz-editor-wrapper">
      <!-- Quiz existant ou creation -->
      <div v-if="quiz" class="quiz-exists-info">
        <div class="quiz-summary">
          <i class="material-icons">quiz</i>
          <div class="quiz-summary-text">
            <span class="quiz-title">{{ quiz.title }}</span>
            <span class="quiz-meta">{{ quiz.questions?.length || 0 }} questions</span>
          </div>
        </div>
        <button @click="$emit('open-quiz-editor', chapter.id, quiz)" class="btn-edit-inline-quiz">
          <i class="material-icons">edit</i>
          Modifier le quiz
        </button>
      </div>
      <div v-else class="quiz-create-prompt">
        <p class="quiz-prompt-text">Aucun quiz cree pour ce chapitre.</p>
        <button @click="$emit('open-quiz-editor', chapter.id)" class="btn-create-quiz">
          <i class="material-icons">add</i>
          Creer un quiz
        </button>
      </div>
    </div>
    <div v-else class="quiz-save-first">
      <i class="material-icons">info</i>
      <span>Enregistrez d'abord le chapitre pour creer un quiz.</span>
    </div>
  </div>
</template>

<script setup>
/**
 * Bloc « Quiz / Testez vos connaissances » d'un chapitre (#28, H5).
 * Sous-composant présentationnel extrait de ChapterEditForm.vue : affiche le
 * résumé du quiz existant, l'invite de création, ou le rappel d'enregistrer
 * d'abord le chapitre. L'ouverture de l'éditeur de quiz est émise au parent.
 */
defineProps({
  chapter: { type: Object, required: true },
  // Quiz du chapitre (résolu par le parent depuis knowledgeChecks), ou null.
  quiz: { type: Object, default: null }
})

defineEmits(['open-quiz-editor'])
</script>

<style scoped>
/* Quiz Editor Inline */
.quiz-editor-inline {
  margin-top: 16px;
}

.quiz-editor-wrapper {
  padding: 16px;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
}

.quiz-exists-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.quiz-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quiz-summary i {
  font-size: 1.5rem;
  color: #6366f1;
}

.quiz-summary-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quiz-summary .quiz-title {
  font-weight: 600;
  color: var(--text-primary);
}

.quiz-summary .quiz-meta {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.btn-edit-inline-quiz {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit-inline-quiz:hover {
  background: #4f46e5;
}

.btn-edit-inline-quiz i {
  font-size: 1rem;
}

.quiz-create-prompt {
  text-align: center;
  padding: 16px;
}

.quiz-prompt-text {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
}

.btn-create-quiz {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-quiz:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-create-quiz i {
  font-size: 1.125rem;
}

.quiz-save-first {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #b45309;
}

.quiz-save-first i {
  font-size: 1.25rem;
}
</style>
