<template>
  <div class="stats-grid">
    <div class="stat-card">
      <p class="stat-label">Total séances</p>
      <p class="stat-value">{{ seances.length }}</p>
    </div>
    <div class="stat-card stat-card-primary">
      <p class="stat-label">Visio activées</p>
      <p class="stat-value">
        {{ seances.filter(s => s.visio_enabled).length }}
      </p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Taux visio</p>
      <p class="stat-value">
        {{ Math.round((seances.filter(s => s.visio_enabled).length / seances.length) * 100) }}%
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * Statistiques de SeanceManagement (#H6 ≤300) : total séances, visios activées,
 * taux. Présentation pure extraite VERBATIM (mêmes calculs inline).
 */
defineProps({
  seances: { type: Array, default: () => [] }
})
</script>

<style scoped>
/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card-primary {
  background: var(--purple-100);
  border-color: var(--purple-400);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
}

.stat-card-primary .stat-label {
  color: var(--violet-600);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-card-primary .stat-value {
  color: var(--violet-700);
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
