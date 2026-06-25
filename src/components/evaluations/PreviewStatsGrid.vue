<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon-wrapper bg-blue-100">
        <ClockIcon class="stat-icon text-blue-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Durée</p>
        <p class="stat-value">{{ evaluation.duree_minutes }} min</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-green-100">
        <DocumentTextIcon class="stat-icon text-green-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Questions</p>
        <p class="stat-value">{{ evaluation.questions_count }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-purple-100">
        <TrophyIcon class="stat-icon text-purple-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Total Points</p>
        <p class="stat-value">{{ evaluation.total_points }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-orange-100">
        <ChartBarIcon class="stat-icon text-orange-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Barème</p>
        <p class="stat-value">{{ evaluation.bareme }}/20</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Grille de statistiques de la prévisualisation (H1) : durée, questions, total
 * points, barème. Présentation pure ; CSS déplacé verbatim depuis PreviewEvaluation.
 */
import { ClockIcon, DocumentTextIcon, TrophyIcon, ChartBarIcon } from '@heroicons/vue/24/outline'

defineProps({
  evaluation: { type: Object, required: true }
})
</script>

<style scoped>
/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--card-shadow);
  transition: box-shadow var(--transition-fast);
}

.stat-card:hover {
  box-shadow: var(--card-hover-shadow);
}

.stat-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
