<template>
  <div class="question-card">
    <div class="question-header">
      <div class="drag-handle">
        <i class="material-icons">drag_indicator</i>
      </div>
      <span class="question-number">Question {{ index + 1 }}</span>
      <select v-model="question.type" class="type-select" @change="onTypeChange">
        <option value="single">Choix unique</option>
        <option value="multiple">Choix multiple</option>
        <option value="true_false">Vrai / Faux</option>
      </select>
      <button @click="$emit('remove')" class="remove-btn">
        <i class="material-icons">delete</i>
      </button>
    </div>

    <div class="question-body">
      <div class="form-group">
        <label>Question *</label>
        <textarea
          v-model="question.question"
          rows="2"
          placeholder="Posez votre question..."
          class="form-input"
        ></textarea>
      </div>

      <!-- Options (#G6 : extrait en sous-composant) -->
      <QuestionOptionsEditor :question="question" :index="index" />

      <!-- Explanation -->
      <div class="form-group">
        <label>Explication (affichee apres reponse)</label>
        <textarea
          v-model="question.explanation"
          rows="2"
          placeholder="Expliquez la bonne reponse..."
          class="form-input"
        ></textarea>
      </div>

      <!-- Points -->
      <div class="form-group points-group">
        <label>Points</label>
        <input
          v-model.number="question.points"
          type="number"
          min="1"
          max="10"
          class="points-input"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Éditeur d'UNE question d'un quiz (#G6 ; éclaté sous 300 lignes en H5).
 * Sous-composant extrait de KnowledgeCheckEditor.vue : l'objet `question` est
 * lié en two-way par référence (élément de la liste éditée en place). L'en-tête
 * (type, suppression), l'énoncé, l'explication et les points sont ici ; la
 * gestion des options est déléguée à QuestionOptionsEditor. Le changement de
 * type réinitialise options/bonne réponse ; la suppression est émise au parent.
 */
import QuestionOptionsEditor from '@/components/lessons/QuestionOptionsEditor.vue'

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true }
})

defineEmits(['remove'])

function onTypeChange() {
  const q = props.question

  if (q.type === 'true_false') {
    q.options = ['Vrai', 'Faux']
    q.correct_answer = null
  } else if (q.type === 'multiple') {
    q.correct_answer = []
  } else {
    q.correct_answer = null
  }
}
</script>

<style scoped>
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
  border-color: #6366f1;
}

.question-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.ghost-question {
  opacity: 0.5;
  background: #6366f1 !important;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.drag-handle {
  cursor: grab;
  color: var(--text-tertiary);
}

.drag-handle:active {
  cursor: grabbing;
}

.question-number {
  font-weight: 600;
  color: var(--text-primary);
}

.type-select {
  margin-left: auto;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.8125rem;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 4px;
  color: #ef4444;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.question-body {
  padding: 1rem;
}

.points-group {
  max-width: 120px;
}

.points-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  text-align: center;
}
</style>
