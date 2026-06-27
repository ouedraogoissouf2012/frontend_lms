<template>
  <div>
    <!-- En-tête sticky -->
    <div class="eval-header">
      <div class="eval-header-left">
        <h1 class="eval-title">{{ evaluation.titre }}</h1>
        <p v-if="evaluation.description" class="eval-description">{{ evaluation.description }}</p>
      </div>
      <div class="eval-timer" :class="{ 'timer-warning': timeRemaining <= 300, 'timer-danger': timeRemaining <= 60 }">
        <span class="timer-value">{{ formatTime(timeRemaining) }}</span>
        <span class="timer-label">Temps restant</span>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="eval-progress">
      <div class="progress-info">
        <span>Progression</span>
        <span>{{ answeredCount }}/{{ evaluation.questions.length }} réponses</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tête de TakeEvaluation (H1) : titre/description, minuteur (warning/danger)
 * et barre de progression. Présentation pure ; CSS déplacé verbatim depuis
 * TakeEvaluation (la keyframe `pulse` est dupliquée car partagée).
 */
defineProps({
  evaluation: { type: Object, required: true },
  timeRemaining: { type: Number, default: 0 },
  answeredCount: { type: Number, default: 0 },
  progressPercentage: { type: Number, default: 0 },
  formatTime: { type: Function, required: true }
})
</script>

<style scoped>
/* Header */
.eval-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.eval-header-left {
  flex: 1;
  min-width: 0;
}

.eval-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.eval-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.eval-timer {
  text-align: center;
  flex-shrink: 0;
}

.timer-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color, #3b82f6);
  font-variant-numeric: tabular-nums;
}

.timer-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
}

.timer-warning .timer-value {
  color: var(--amber-500);
}

.timer-danger .timer-value {
  color: var(--red-500);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Progress */
.eval-progress {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--bg-secondary, #e5e7eb);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color, #3b82f6), #8b5cf6);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .eval-header {
    flex-direction: column;
    gap: 1rem;
  }

  .eval-timer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .timer-value {
    font-size: 1.5rem;
  }

  .timer-label {
    margin-top: 0;
  }
}
</style>
