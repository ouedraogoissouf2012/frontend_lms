<template>
  <div class="calendar-legend">
    <div class="legend-item">
      <span class="legend-dot seance"></span>
      <span class="legend-label">Séances</span>
    </div>
    <div class="legend-item">
      <span class="legend-dot evaluation"></span>
      <span class="legend-label">Évaluations</span>
    </div>
    <div class="legend-item">
      <span class="legend-dot visio"></span>
      <span class="legend-label">Visioconférences</span>
    </div>
  </div>
</template>

<script setup>
/**
 * Légende du widget calendrier (H8 — décomposition CalendarWidget.vue).
 * Sous-composant purement statique : CSS déplacé verbatim.
 */
</script>

<style scoped>
/* Legend */
.calendar-legend {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
}

.legend-dot.seance {
  background: var(--blue-500);
}

.legend-dot.evaluation {
  background: var(--amber-500);
}

.legend-dot.visio {
  background: var(--emerald-500);
}

.legend-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-legend {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
