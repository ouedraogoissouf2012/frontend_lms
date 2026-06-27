<template>
  <div class="lesson-stats">
    <div class="stat-item stat-started">
      <div class="stat-value">{{ statistics.students_started }}</div>
      <div class="stat-label">Débutés</div>
    </div>
    <div class="stat-item stat-completed">
      <div class="stat-value">{{ statistics.students_completed }}</div>
      <div class="stat-label">Terminés</div>
    </div>
    <div class="stat-item stat-average">
      <div class="stat-value">{{ statistics.average_completion_rate }}%</div>
      <div class="stat-label">Moyenne</div>
    </div>
  </div>
</template>

<script setup>
/**
 * Statistiques enseignant d'une LessonCard (#H4 ≤300) : débutés / terminés / moyenne.
 * Présentationnel pur, données via la prop `statistics`.
 */
defineProps({
  statistics: { type: Object, required: true }
})
</script>

<style scoped>
.lesson-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.stat-item {
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.stat-started {
  background: var(--info-bg);
}

.stat-completed {
  background: var(--emerald-100);
}

.stat-average {
  background: #e9d5ff;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-started .stat-value {
  color: var(--info-text);
}

.stat-completed .stat-value {
  color: var(--emerald-800);
}

.stat-average .stat-value {
  color: var(--violet-600);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 640px) {
  .lesson-stats {
    grid-template-columns: 1fr;
  }
}
</style>
