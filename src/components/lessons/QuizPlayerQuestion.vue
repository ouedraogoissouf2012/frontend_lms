<template>
  <div class="player-quiz">
    <!-- Progress bar -->
    <div class="quiz-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
    </div>

    <!-- Timer -->
    <div v-if="timeLimit" class="quiz-timer" :class="{ warning: timeRemaining < 60 }">
      <i class="material-icons">schedule</i>
      <span>{{ formatTime(timeRemaining) }}</span>
    </div>

    <!-- Question actuelle -->
    <div class="question-container">
      <h4 class="question-text">{{ currentQuestion.question }}</h4>

      <div class="options-list">
        <label
          v-for="(option, index) in currentQuestion.options"
          :key="index"
          class="option-item"
          :class="{
            selected: isOptionSelected(index),
            'radio-type': currentQuestion.type !== 'multiple',
            'checkbox-type': currentQuestion.type === 'multiple'
          }"
        >
          <input
            v-if="currentQuestion.type === 'multiple'"
            type="checkbox"
            :checked="isOptionSelected(index)"
            @change="$emit('toggle', index)"
          />
          <input
            v-else
            type="radio"
            :name="'question-' + currentIndex"
            :checked="answers[currentIndex] === index"
            @change="$emit('select', index)"
          />
          <span class="option-text">{{ option }}</span>
        </label>
      </div>
    </div>

    <!-- Navigation (#G6 : extrait en sous-composant) -->
    <QuizQuestionNav
      :current-index="currentIndex"
      :questions="questions"
      :answers="answers"
      :submitting="submitting"
      @prev="$emit('prev')"
      @next="$emit('next')"
      @goto="$emit('goto', $event)"
      @submit="$emit('submit')"
    />
  </div>
</template>

<script setup>
/**
 * Écran « quiz en cours » du lecteur (#G6 ; éclaté sous 300 lignes en H5).
 * Sous-composant présentationnel extrait de KnowledgeCheckPlayer.vue : barre de
 * progression, minuteur, question courante avec ses options (radio/checkbox) et
 * navigation (précédent / pastilles / suivant / terminer). Les données viennent
 * du composable en props ; les actions sont émises au parent qui mute l'état.
 * Les helpers d'affichage purs (sélection, format du temps) sont locaux ; la
 * navigation est déléguée à QuizQuestionNav.
 */
import QuizQuestionNav from '@/components/lessons/QuizQuestionNav.vue'

const props = defineProps({
  currentQuestion: { type: Object, default: () => ({}) },
  currentIndex: { type: Number, default: 0 },
  questions: { type: Array, default: () => [] },
  answers: { type: Array, default: () => [] },
  progressPercent: { type: Number, default: 0 },
  timeLimit: { type: [Number, null], default: null },
  timeRemaining: { type: Number, default: 0 },
  submitting: { type: Boolean, default: false }
})

defineEmits(['select', 'toggle', 'prev', 'next', 'goto', 'submit'])

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function isOptionSelected(index) {
  const answer = props.answers[props.currentIndex]
  if (Array.isArray(answer)) {
    return answer.includes(index)
  }
  return answer === index
}
</script>

<style scoped>
/* Quiz en cours */
.player-quiz {
  padding: 1.5rem;
}

.quiz-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, var(--indigo-500) 0%, var(--violet-500) 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.quiz-timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.quiz-timer.warning {
  background: var(--error-bg);
  color: var(--red-700);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.question-container {
  margin-bottom: 2rem;
}

.question-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: var(--indigo-500);
}

.option-item.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--indigo-500);
}

.option-item input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.option-text {
  flex: 1;
  font-size: 1rem;
  color: var(--text-primary);
}
</style>
