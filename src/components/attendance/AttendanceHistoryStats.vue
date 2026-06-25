<template>
  <div class="stats-grid">
    <div class="stat-card border-l-blue">
      <div class="stat-header">
        <i class="fa fa-list-alt stat-icon"></i>
        <span class="stat-label">Total Participations</span>
      </div>
      <p class="stat-value">{{ total }}</p>
    </div>

    <div class="stat-card border-l-green">
      <div class="stat-header">
        <span class="stat-icon">◷</span>
        <span class="stat-label">Durée Moyenne</span>
      </div>
      <p class="stat-value">{{ averageDuration }} min</p>
    </div>

    <div class="stat-card border-l-orange">
      <div class="stat-header">
        <i class="fa fa-check stat-icon"></i>
        <span class="stat-label">Présents</span>
      </div>
      <p class="stat-value">{{ connectedCount }}</p>
    </div>

    <div class="stat-card border-l-red">
      <div class="stat-header">
        <span class="stat-icon">✕</span>
        <span class="stat-label">Déconnectés</span>
      </div>
      <p class="stat-value">{{ disconnectedCount }}</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes statistiques de l'historique des présences (H7) — sous-composant
 * présentationnel extrait d'AttendanceHistory.vue. Données pures via props.
 */
defineProps({
  total: { type: Number, default: 0 },
  averageDuration: { type: Number, default: 0 },
  connectedCount: { type: Number, default: 0 },
  disconnectedCount: { type: Number, default: 0 }
})
</script>

<style scoped>
/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}

.border-l-blue { border-left-color: #3b82f6; }
.border-l-green { border-left-color: #10b981; }
.border-l-orange { border-left-color: #f59e0b; }
.border-l-red { border-left-color: #ef4444; }
.border-l-purple { border-left-color: #8b5cf6; }

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
