<template>
  <div class="stats-grid">
    <div class="stat-card border-l-blue">
      <div class="stat-header">
        <i class="fa fa-home stat-icon"></i>
        <span class="stat-label">Total Classes</span>
      </div>
      <p class="stat-value">{{ stats.total }}</p>
    </div>

    <div class="stat-card border-l-green">
      <div class="stat-header">
        <i class="fa fa-user stat-icon"></i>
        <span class="stat-label">Total Étudiants</span>
      </div>
      <p class="stat-value">{{ stats.totalEtudiants }}</p>
    </div>

    <div class="stat-card border-l-orange">
      <div class="stat-header">
        <span class="stat-icon">☷</span>
        <span class="stat-label">Total Matières</span>
      </div>
      <p class="stat-value">{{ stats.totalMatieres }}</p>
    </div>

    <div class="stat-card border-l-purple">
      <div class="stat-header">
        <span class="stat-icon">☀</span>
        <span class="stat-label">Classes Actives</span>
      </div>
      <p class="stat-value">{{ stats.actives }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes de statistiques d'AdminClasses (#G1 ≤300). Présentation pure : reçoit
 * l'objet stats (total / totalEtudiants / totalMatieres / actives) et l'affiche.
 */
defineProps({
  stats: {
    type: Object,
    default: () => ({ total: 0, totalEtudiants: 0, totalMatieres: 0, actives: 0 })
  }
})
</script>

<style scoped>
/* Stat cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid transparent;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.border-l-blue {
  border-left-color: #3b82f6;
}

.border-l-green {
  border-left-color: #10b981;
}

.border-l-purple {
  border-left-color: #8b5cf6;
}

.border-l-orange {
  border-left-color: #f59e0b;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .stat-value {
    font-size: 1.75rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
