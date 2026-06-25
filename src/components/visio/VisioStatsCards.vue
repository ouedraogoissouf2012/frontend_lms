<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-header">
        <CalendarDaysIcon class="stat-icon text-blue-600" />
        <span class="stat-label">Total</span>
      </div>
      <p class="stat-value">{{ stats.total }}</p>
      <p class="stat-change">séances avec visio</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <SignalIcon class="stat-icon text-green-600" />
        <span class="stat-label">En cours</span>
      </div>
      <p class="stat-value">{{ stats.enCours }}</p>
      <p class="stat-change">actives maintenant</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <ClockIcon class="stat-icon text-orange-600" />
        <span class="stat-label">À venir</span>
      </div>
      <p class="stat-value">{{ stats.aVenir }}</p>
      <p class="stat-change">prochainement</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <CheckCircleIcon class="stat-icon text-gray-600" />
        <span class="stat-label">Terminées</span>
      </div>
      <p class="stat-value">{{ stats.terminees }}</p>
      <p class="stat-change">ce mois</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes de statistiques de TeacherVisioList (#G1 ≤300). Présentation pure :
 * 4 compteurs (total / en cours / à venir / terminées). Reçoit l'objet `stats`.
 */
import {
  ClockIcon,
  SignalIcon,
  CheckCircleIcon,
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: {
    type: Object,
    required: true
  }
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
