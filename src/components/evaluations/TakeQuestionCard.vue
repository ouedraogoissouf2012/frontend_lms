<template>
  <div
    class="question-card"
    :class="{ 'question-answered': isAnswered(question.id) }"
  >
    <!-- En-tête de question -->
    <div class="question-header">
      <div class="question-meta">
        <span class="question-number">Question {{ index + 1 }}</span>
        <span class="question-points">{{ question.points }} point(s)</span>
      </div>
      <i v-if="isAnswered(question.id)" class="fa fa-check-circle question-check"></i>
    </div>

    <p class="question-text">{{ question.question }}</p>

    <!-- QCM Simple -->
    <div v-if="question.type === 'qcm'" class="options-list">
      <label
        v-for="(option, optIndex) in question.options"
        :key="optIndex"
        class="option-item"
        :class="{ 'option-selected': answers[question.id] === option }"
      >
        <input
          type="radio"
          :name="'question-' + question.id"
          :value="option"
          v-model="answers[question.id]"
          class="option-input"
        />
        <span class="option-label">{{ option }}</span>
      </label>
    </div>

    <!-- QCM Multiple -->
    <div v-else-if="question.type === 'qcm_multiple'" class="options-list">
      <label
        v-for="(option, optIndex) in question.options"
        :key="optIndex"
        class="option-item"
        :class="{ 'option-selected': isOptionSelected(question.id, option) }"
      >
        <input
          type="checkbox"
          :value="option"
          @change="$emit('toggle-multiple', question.id, option)"
          :checked="isOptionSelected(question.id, option)"
          class="option-input option-checkbox"
        />
        <span class="option-label">{{ option }}</span>
      </label>
    </div>

    <!-- Vrai/Faux -->
    <div v-else-if="question.type === 'vrai_faux'" class="options-list">
      <label
        class="option-item"
        :class="{ 'option-selected': answers[question.id] === 'Vrai' }"
      >
        <input type="radio" :name="'question-' + question.id" value="Vrai" v-model="answers[question.id]" class="option-input" />
        <span class="option-label">Vrai</span>
      </label>
      <label
        class="option-item"
        :class="{ 'option-selected': answers[question.id] === 'Faux' }"
      >
        <input type="radio" :name="'question-' + question.id" value="Faux" v-model="answers[question.id]" class="option-input" />
        <span class="option-label">Faux</span>
      </label>
    </div>

    <!-- Réponse courte -->
    <div v-else-if="question.type === 'reponse_courte'">
      <input v-model="answers[question.id]" type="text" class="text-input" placeholder="Votre réponse..." />
    </div>

    <!-- Dissertation -->
    <div v-else-if="question.type === 'dissertation'">
      <textarea v-model="answers[question.id]" rows="5" class="text-input textarea-input" placeholder="Votre réponse..."></textarea>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte d'une question de TakeEvaluation (H1) : rend les 5 types (QCM simple,
 * QCM multiple, vrai/faux, réponse courte, dissertation). Les v-model écrivent
 * dans l'objet `answers` partagé (même référence) ; `toggle-multiple` est émis
 * pour les QCM multiples. CSS déplacé verbatim depuis TakeEvaluation.
 */
defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
  answers: { type: Object, default: () => ({}) },
  isAnswered: { type: Function, required: true },
  isOptionSelected: { type: Function, required: true }
})

defineEmits(['toggle-multiple'])
</script>

<style scoped>
.question-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.question-answered {
  border-left-color: var(--emerald-500);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.question-number {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.question-points {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.question-check {
  color: var(--emerald-500);
  font-size: 1.25rem;
}

.question-text {
  font-size: 1.0625rem;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background: var(--bg-secondary, #f9fafb);
  border-color: var(--primary-color);
}

.option-selected {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.08);
}

.option-input {
  accent-color: var(--primary-color);
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.option-label {
  color: var(--text-primary);
  font-size: 0.9375rem;
}

/* Text inputs */
.text-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-primary);
  font-size: 0.9375rem;
  transition: border-color 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.15);
}

.textarea-input {
  resize: vertical;
  min-height: 120px;
}

/* Responsive */
@media (max-width: 768px) {
  .question-card {
    padding: 1.25rem;
  }
}
</style>
