<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <!-- Widget Activité Système -->
    <div class="widget-card">
      <div class="widget-header">
        <ChartBarIcon class="widget-icon text-indigo-600" />
        <h2 class="widget-title">Activité Système</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <p class="stat-label">Séances Actives</p>
          <p class="stat-value text-purple-600">
            {{ stats?.nb_seances_actives || 0 }}
          </p>
        </div>
        <div class="stat-item">
          <p class="stat-label">Évaluations Totales</p>
          <p class="stat-value text-orange-600">
            {{ stats?.nb_evaluations || 0 }}
          </p>
        </div>
      </div>
    </div>

    <!-- Widget Gestion -->
    <div class="widget-card">
      <div class="widget-header">
        <BuildingLibraryIcon class="widget-icon text-blue-600" />
        <h2 class="widget-title">Vue d'Ensemble</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <p class="stat-label">Filières</p>
          <p class="stat-value text-blue-600">
            {{ stats?.nb_filieres || 0 }}
          </p>
        </div>
        <div class="stat-item">
          <p class="stat-label">Niveaux</p>
          <p class="stat-value text-green-600">
            {{ stats?.nb_niveaux || 0 }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Widgets Activité Système + Vue d'Ensemble d'AdminDashboard (#H3 ≤300). */
import {
  BuildingLibraryIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, default: () => ({}) },
})
</script>

<style scoped>
/* Widget card */
.widget-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-item .stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-item .stat-value {
  font-size: 2rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
