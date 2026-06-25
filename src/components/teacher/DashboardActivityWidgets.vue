<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <!-- Widget Activité Récente -->
    <div class="widget-card">
      <div class="widget-header">
        <ChartBarIcon class="widget-icon text-indigo-600" />
        <h2 class="widget-title">Activité Récente</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <p class="stat-label">Étudiants Totaux</p>
          <p class="stat-value text-indigo-600">
            {{ dashboardData.statistiques?.total_etudiants || 0 }}
          </p>
        </div>
        <div class="stat-item">
          <p class="stat-label">Leçons Créées</p>
          <p class="stat-value text-blue-600">
            {{ dashboardData.statistiques?.total_lecons || dashboardData.lessons?.length || 0 }}
          </p>
        </div>
      </div>
    </div>

    <!-- Widget Prochaines Séances -->
    <div class="widget-card">
      <div class="widget-header">
        <CalendarIcon class="widget-icon text-purple-600" />
        <h2 class="widget-title">Aujourd'hui</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <p class="stat-label">Séances du Jour</p>
          <p class="stat-value text-purple-600">
            {{ dashboardData.statistiques?.seances_aujourdhui || 0 }}
          </p>
        </div>
        <div class="stat-item">
          <p class="stat-label">Évaluations en Cours</p>
          <p class="stat-value text-orange-600">
            {{ dashboardData.statistiques?.evaluations_en_cours || 0 }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Widgets « Activité récente » + « Aujourd'hui » du dashboard enseignant
 *  (#H11 ≤300). Présentation pure : 4 indicateurs issus de statistiques. */
import { ChartBarIcon, CalendarIcon } from '@heroicons/vue/24/outline'

defineProps({
  dashboardData: { type: Object, required: true }
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

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
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
