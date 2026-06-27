<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon-wrapper active">
        <VideoCameraIcon class="stat-icon" />
      </div>
      <div class="stat-content">
        <p class="stat-label">En cours</p>
        <p class="stat-value">{{ stats.active }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper scheduled">
        <CalendarIcon class="stat-icon" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Planifiées</p>
        <p class="stat-value">{{ stats.scheduled }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper completed">
        <CheckCircleIcon class="stat-icon" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Terminées</p>
        <p class="stat-value">{{ stats.completed }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper total">
        <ChartBarIcon class="stat-icon" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Total</p>
        <p class="stat-value">{{ stats.total }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Cartes de statistiques d'AdminVisio (#G1 ≤300). Présentation pure : 4 compteurs. */
import {
  VideoCameraIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: {
    type: Object,
    default: () => ({ active: 0, scheduled: 0, completed: 0, total: 0 })
  }
})
</script>

<style scoped>
/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrapper.active {
  background: var(--success-bg);
}

.stat-icon-wrapper.scheduled {
  background: var(--info-bg);
}

.stat-icon-wrapper.completed {
  background: #f3f4f6;
}

.stat-icon-wrapper.total {
  background: var(--warning-bg);
}

.stat-icon {
  width: 2rem;
  height: 2rem;
}

.stat-icon-wrapper.active .stat-icon {
  color: var(--success-text);
}

.stat-icon-wrapper.scheduled .stat-icon {
  color: var(--info-text);
}

.stat-icon-wrapper.completed .stat-icon {
  color: #6b7280;
}

.stat-icon-wrapper.total .stat-icon {
  color: var(--amber-700);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
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
