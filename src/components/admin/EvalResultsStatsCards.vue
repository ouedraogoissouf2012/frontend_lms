<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon-wrapper bg-blue-100">
        <DocumentTextIcon class="stat-icon text-blue-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Total</p>
        <p class="stat-value">{{ stats.total }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-green-100">
        <PlayIcon class="stat-icon text-green-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">En cours</p>
        <p class="stat-value">{{ stats.enCours }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-purple-100">
        <CheckCircleIcon class="stat-icon text-purple-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Terminées</p>
        <p class="stat-value">{{ stats.terminees }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-indigo-100">
        <ComputerDesktopIcon class="stat-icon text-indigo-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">En ligne</p>
        <p class="stat-value">{{ stats.avecVersionEnLigne }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes de statistiques d'AdminEvaluationResults (#H3 ≤300). Présentation pure :
 * 4 compteurs dérivés des évaluations filtrées (total / en cours / terminées / en ligne).
 */
import {
  DocumentTextIcon,
  PlayIcon,
  CheckCircleIcon,
  ComputerDesktopIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: {
    type: Object,
    default: () => ({ total: 0, enCours: 0, terminees: 0, avecVersionEnLigne: 0 })
  }
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
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
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
