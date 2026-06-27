<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-header">
        <i class="fa fa-dot-circle-o stat-icon"></i>
        <span class="stat-label">Total</span>
      </div>
      <p class="stat-value">{{ stats.total }}</p>
      <p class="stat-change">séances programmées</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <i class="fa fa-sun-o stat-icon stat-icon-active"></i>
        <span class="stat-label">En direct</span>
      </div>
      <p class="stat-value">{{ stats.active }}</p>
      <p class="stat-change">cours en cours</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-icon stat-icon-scheduled">◑</span>
        <span class="stat-label">Programmées</span>
      </div>
      <p class="stat-value">{{ stats.scheduled }}</p>
      <p class="stat-change">à venir</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <i class="fa fa-check stat-icon stat-icon-finished"></i>
        <span class="stat-label">Terminées</span>
      </div>
      <p class="stat-value">{{ stats.finished }}</p>
      <p class="stat-change">ce mois</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Grille de statistiques de TeacherSeances (#H6 ≤300) : total, en direct,
 * programmées, terminées. Présentation pure extraite VERBATIM.
 */
defineProps({
  stats: { type: Object, default: () => ({ total: 0, active: 0, scheduled: 0, finished: 0 }) }
})
</script>

<style scoped>
/* Statistics */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.stat-icon-active {
  color: #22c55e;
}

.stat-icon-scheduled {
  color: var(--amber-500);
}

.stat-icon-finished {
  color: #6b7280;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
