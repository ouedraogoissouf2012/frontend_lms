<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-header">
        <DocumentTextIcon class="stat-icon text-blue-600" />
        <span class="stat-label">Total</span>
      </div>
      <p class="stat-value">{{ stats.total }}</p>
      <p class="stat-change">évaluations</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <ClockIcon class="stat-icon text-green-600" />
        <span class="stat-label">En cours</span>
      </div>
      <p class="stat-value">{{ stats.enCours }}</p>
      <p class="stat-change">actives</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <CheckCircleIcon class="stat-icon text-gray-600" />
        <span class="stat-label">Terminées</span>
      </div>
      <p class="stat-value">{{ stats.terminees }}</p>
      <p class="stat-change">ce mois</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <ComputerDesktopIcon class="stat-icon text-purple-600" />
        <span class="stat-label">En ligne</span>
      </div>
      <p class="stat-value">{{ stats.avecVersionEnLigne }}</p>
      <p class="stat-change">configurées</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Grille de statistiques de TeacherEvaluations (H1) : total, en cours, terminées,
 * versions en ligne. Présentation pure ; CSS déplacé verbatim depuis
 * TeacherEvaluations (y compris la règle responsive de `.stats-grid`).
 */
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ComputerDesktopIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, required: true }
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
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
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
