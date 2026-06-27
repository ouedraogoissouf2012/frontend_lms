<template>
  <div class="progress-card">
    <div class="progress-header">
      <span>Progression de prévisualisation</span>
      <span>{{ answeredCount }}/{{ questionsCount }} réponses simulées</span>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * Barre de progression de la prévisualisation (H1) : réponses simulées / total.
 * Présentation pure ; CSS déplacé verbatim depuis PreviewEvaluation.
 */
defineProps({
  answeredCount: { type: Number, default: 0 },
  questionsCount: { type: Number, default: 0 },
  progressPercentage: { type: Number, default: 0 }
})
</script>

<style scoped>
/* Barre de progression */
.progress-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.progress-bar-container {
  width: 100%;
  height: 0.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--violet-500) 0%, var(--indigo-500) 100%);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
</style>
