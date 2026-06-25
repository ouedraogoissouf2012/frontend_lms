<template>
  <div class="options-section">
    <label>Options de reponse *</label>
    <div
      v-for="(option, optIndex) in question.options"
      :key="optIndex"
      class="option-row"
    >
      <!-- Radio/Checkbox for correct answer -->
      <div class="correct-indicator">
        <input
          v-if="question.type === 'multiple'"
          type="checkbox"
          :checked="isCorrectOption(optIndex)"
          @change="toggleCorrectMultiple(optIndex)"
        />
        <input
          v-else
          type="radio"
          :name="'correct-' + index"
          :checked="question.correct_answer === optIndex"
          @change="question.correct_answer = optIndex"
        />
      </div>
      <input
        v-model="question.options[optIndex]"
        type="text"
        :placeholder="'Option ' + (optIndex + 1)"
        class="option-input"
        :disabled="question.type === 'true_false'"
      />
      <button
        v-if="question.type !== 'true_false' && question.options.length > 2"
        @click="removeOption(optIndex)"
        class="remove-option-btn"
      >
        <i class="material-icons">close</i>
      </button>
    </div>
    <button
      v-if="question.type !== 'true_false' && question.options.length < 6"
      @click="addOption"
      class="add-option-btn"
    >
      <i class="material-icons">add</i>
      Ajouter une option
    </button>
  </div>
</template>

<script setup>
/**
 * Éditeur des options d'UNE question (#G6 ; éclaté sous 300 lignes en H5).
 * Sous-composant extrait de QuestionEditorCard.vue : rend les lignes d'options,
 * la sélection de la bonne réponse (radio choix unique / checkbox choix
 * multiple) et l'ajout/suppression d'option. Mute `question` par référence ;
 * `index` sert à isoler les groupes de radios (attribut name).
 */
const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true }
})

function addOption() {
  props.question.options.push('')
}

function removeOption(optionIndex) {
  const q = props.question
  q.options.splice(optionIndex, 1)

  // Adjust correct_answer if needed
  if (q.type === 'multiple' && Array.isArray(q.correct_answer)) {
    q.correct_answer = q.correct_answer
      .filter(i => i !== optionIndex)
      .map(i => i > optionIndex ? i - 1 : i)
  } else if (q.correct_answer === optionIndex) {
    q.correct_answer = null
  } else if (q.correct_answer > optionIndex) {
    q.correct_answer--
  }
}

function isCorrectOption(optionIndex) {
  const q = props.question
  return Array.isArray(q.correct_answer) && q.correct_answer.includes(optionIndex)
}

function toggleCorrectMultiple(optionIndex) {
  const q = props.question
  if (!Array.isArray(q.correct_answer)) {
    q.correct_answer = []
  }

  const idx = q.correct_answer.indexOf(optionIndex)
  if (idx >= 0) {
    q.correct_answer.splice(idx, 1)
  } else {
    q.correct_answer.push(optionIndex)
  }
}
</script>

<style scoped>
.options-section {
  margin-bottom: 1rem;
}

.options-section > label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.correct-indicator input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.option-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.option-input:focus {
  outline: none;
  border-color: #6366f1;
}

.option-input:disabled {
  background: var(--bg-tertiary);
  cursor: not-allowed;
}

.remove-option-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--text-tertiary);
  transition: color 0.2s;
}

.remove-option-btn:hover {
  color: #ef4444;
}

.add-option-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: none;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.add-option-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}
</style>
