<template>
  <div class="quiz-navigation">
    <button
      @click="$emit('prev')"
      :disabled="currentIndex === 0"
      class="nav-btn prev-btn"
    >
      <i class="material-icons">arrow_back</i>
      Precedent
    </button>

    <div class="question-dots">
      <button
        v-for="(_, i) in questions"
        :key="i"
        @click="$emit('goto', i)"
        class="dot"
        :class="{
          active: i === currentIndex,
          answered: answers[i] !== null && answers[i] !== undefined
        }"
      >
        {{ i + 1 }}
      </button>
    </div>

    <button
      v-if="currentIndex < questions.length - 1"
      @click="$emit('next')"
      class="nav-btn next-btn"
    >
      Suivant
      <i class="material-icons">arrow_forward</i>
    </button>
    <button
      v-else
      @click="$emit('submit')"
      :disabled="submitting"
      class="nav-btn submit-btn"
    >
      <i class="material-icons" v-if="submitting">sync</i>
      <i class="material-icons" v-else>check</i>
      {{ submitting ? 'Envoi...' : 'Terminer' }}
    </button>
  </div>
</template>

<script setup>
/**
 * Barre de navigation du lecteur de quiz (#G6 ; éclaté sous 300 lignes en H5).
 * Sous-composant présentationnel extrait de QuizPlayerQuestion.vue : bouton
 * précédent, pastilles de questions (état actif/répondu) et bouton suivant ou
 * terminer selon la position. Toutes les actions sont émises au parent.
 */
defineProps({
  currentIndex: { type: Number, default: 0 },
  questions: { type: Array, default: () => [] },
  answers: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false }
})

defineEmits(['prev', 'next', 'goto', 'submit'])
</script>

<style scoped>
.quiz-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.prev-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.prev-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.prev-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.next-btn {
  background: #6366f1;
  border: none;
  color: white;
}

.next-btn:hover {
  background: #4f46e5;
}

.submit-btn {
  background: #10b981;
  border: none;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #059669;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.question-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.dot.active {
  border-color: #6366f1;
  background: #6366f1;
  color: white;
}

.dot.answered:not(.active) {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

@media (max-width: 640px) {
  .quiz-navigation {
    flex-wrap: wrap;
  }

  .question-dots {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: 1rem;
  }
}
</style>
