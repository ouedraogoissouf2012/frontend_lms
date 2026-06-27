<template>
  <div class="questions-container">
    <div
      v-for="(question, index) in questions"
      :key="question.id"
      class="question-card"
    >
      <!-- En-tête de question -->
      <div class="question-header">
        <div class="question-header-left">
          <span class="question-badge">Question {{ index + 1 }}</span>
          <span class="points-badge">{{ question.points }} point(s)</span>
          <span class="preview-badge">Prévisualisation</span>
        </div>
        <span v-if="answers[question.id] !== undefined" class="answered-icon">
          <CheckIcon class="w-5 h-5" />
        </span>
      </div>

      <p class="question-text">{{ question.question }}</p>

      <!-- Options QCM -->
      <div v-if="question.type === 'qcm' && question.options" class="options-list">
        <button
          v-for="(option, optIndex) in question.options"
          :key="optIndex"
          @click="$emit('select', question.id, option)"
          :class="[
            'option-button',
            answers[question.id] === option ? 'option-selected' : ''
          ]"
        >
          <div class="option-radio" :class="{ selected: answers[question.id] === option }">
            <div v-if="answers[question.id] === option" class="option-radio-dot"></div>
          </div>
          <span>{{ option }}</span>
        </button>
      </div>

      <!-- Réponse courte -->
      <div v-else-if="question.type === 'reponse_courte'" class="answer-input-wrapper">
        <textarea
          v-model="answers[question.id]"
          rows="3"
          placeholder="Entrez votre réponse ici... (mode prévisualisation)"
          class="answer-input"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Liste des questions de la prévisualisation (H1) : QCM (sélection simulée) et
 * réponse courte (saisie liée à l'objet `answers` partagé — même référence).
 * Émet `select` pour les QCM ; CSS déplacé verbatim depuis PreviewEvaluation.
 */
import { CheckIcon } from '@heroicons/vue/24/outline'

defineProps({
  questions: { type: Array, default: () => [] },
  answers: { type: Object, default: () => ({}) }
})

defineEmits(['select'])
</script>

<style scoped>
/* Questions */
.questions-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.question-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  transition: box-shadow var(--transition-fast);
}

.question-card:hover {
  box-shadow: var(--card-hover-shadow);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.question-badge {
  background: var(--blue-100);
  color: var(--blue-800);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
}

.points-badge {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.preview-badge {
  background: rgba(139, 92, 246, 0.1);
  color: var(--violet-500);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
}

.answered-icon {
  color: var(--violet-500);
}

.question-text {
  font-size: 1.125rem;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  text-align: left;
  padding: 1rem;
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.option-button:hover {
  border-color: var(--violet-500);
  background: rgba(139, 92, 246, 0.05);
}

.option-button.option-selected {
  border-color: var(--violet-500);
  background: rgba(139, 92, 246, 0.1);
}

.option-radio {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: 2px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.option-radio.selected {
  border-color: var(--violet-500);
  background: var(--violet-500);
}

.option-radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: white;
  border-radius: 50%;
}

/* Réponse courte */
.answer-input-wrapper {
  margin-top: 1rem;
}

.answer-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--input-border);
  border-radius: var(--radius-lg);
  background: var(--input-bg);
  color: var(--input-text);
  font-size: 1rem;
  transition: all var(--transition-fast);
  resize: vertical;
}

.answer-input:focus {
  outline: none;
  border-color: var(--violet-500);
  background: var(--input-bg);
}

.answer-input::placeholder {
  color: var(--input-placeholder);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.question-card {
  animation: fadeIn 0.3s ease-out;
}
</style>
