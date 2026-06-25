<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon-wrapper bg-blue-100">
        <UserGroupIcon class="stat-icon text-blue-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Total étudiants</p>
        <p class="stat-value">{{ statistiques?.total_etudiants || 0 }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-green-100">
        <CheckCircleIcon class="stat-icon text-green-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Ont soumis</p>
        <p class="stat-value">{{ statistiques?.etudiants_soumis || 0 }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-purple-100">
        <ChartBarIcon class="stat-icon text-purple-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Moyenne classe</p>
        <p class="stat-value">{{ (statistiques?.moyenne_classe !== null && statistiques?.moyenne_classe !== undefined) ? statistiques.moyenne_classe.toFixed(2) : '-' }}/20</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-indigo-100">
        <ClockIcon class="stat-icon text-indigo-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Taux participation</p>
        <p class="stat-value">{{ statistiques?.taux_participation || 0 }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes de statistiques globales d'AdminEvaluationDetails (#H3 ≤300). Présentation
 * pure : 4 compteurs alimentés par l'objet statistiques (prop). Aucun appel API.
 */
import {
  UserGroupIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

defineProps({
  statistiques: { type: Object, default: null },
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
}

.stat-icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
</style>
