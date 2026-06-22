<template>
  <div class="player-results">
    <div class="results-header" :class="{ passed: results.passed }">
      <div class="results-icon">
        <i class="material-icons">{{ results.passed ? 'emoji_events' : 'sentiment_dissatisfied' }}</i>
      </div>
      <h3 class="results-title">
        {{ results.passed ? 'Felicitations !' : 'Continuez vos efforts !' }}
      </h3>
      <p class="results-message">{{ results.message }}</p>
    </div>

    <div class="score-display">
      <div class="score-circle" :class="{ passed: results.passed }">
        <span class="score-value">{{ results.score }}%</span>
        <span class="score-label">Score</span>
      </div>
      <div class="score-details">
        <p>
          <strong>{{ results.correct_answers }}</strong> / {{ results.total_questions }} bonnes reponses
        </p>
        <p>Temps: {{ results.time_spent }}</p>
        <p>Score minimum: {{ results.passing_score }}%</p>
      </div>
    </div>

    <!-- Corrections (#G6 : extrait en sous-composant) -->
    <QuizPlayerCorrections :answers="results.answers" :questions="questions" />

    <div class="results-actions">
      <button
        v-if="results.can_retry"
        @click="$emit('retry')"
        class="retry-btn"
      >
        <i class="material-icons">replay</i>
        Retenter
      </button>
      <button @click="$emit('close')" class="close-btn">
        <i class="material-icons">close</i>
        Fermer
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Écran de résultats du lecteur de quiz (#G6 ; éclaté sous 300 lignes en H5).
 * Sous-composant présentationnel extrait de KnowledgeCheckPlayer.vue : bandeau
 * de réussite/échec, score, détails et corrections par question. `results` et
 * `questions` sont des props ; « retenter » et « fermer » sont émis au parent.
 * Les corrections par question sont déléguées à QuizPlayerCorrections.
 */
import QuizPlayerCorrections from '@/components/lessons/QuizPlayerCorrections.vue'

defineProps({
  results: { type: Object, required: true },
  questions: { type: Array, default: () => [] }
})

defineEmits(['retry', 'close'])
</script>

<style scoped>
/* Resultats */
.player-results {
  padding: 2rem;
}

.results-header {
  text-align: center;
  padding: 2rem;
  margin: -2rem -2rem 2rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.results-header.passed {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.results-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.results-icon i {
  font-size: 2.5rem;
  color: #b45309;
}

.results-header.passed .results-icon i {
  color: #047857;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 0.5rem 0;
}

.results-header.passed .results-title {
  color: #047857;
}

.results-message {
  color: #a16207;
  margin: 0;
}

.results-header.passed .results-message {
  color: #059669;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.score-circle.passed {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.score-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 0.75rem;
  opacity: 0.9;
}

.score-details {
  text-align: left;
}

.score-details p {
  margin: 0.25rem 0;
  color: var(--text-secondary);
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.retry-btn,
.close-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  background: #6366f1;
  border: none;
  color: white;
}

.retry-btn:hover {
  background: #4f46e5;
}

.close-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.close-btn:hover {
  background: var(--bg-secondary);
}

@media (max-width: 640px) {
  .score-display {
    flex-direction: column;
    text-align: center;
  }

  .score-details {
    text-align: center;
  }
}
</style>
