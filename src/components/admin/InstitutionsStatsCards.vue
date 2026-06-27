<template>
  <div class="stats-grid">
    <div class="stat-card">
      <i class="fa fa-university stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ total }}</span>
        <span class="stat-label">Institutions</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-check-circle stat-icon stat-icon-green"></i>
      <div class="stat-details">
        <span class="stat-value">{{ active }}</span>
        <span class="stat-label">Actives</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-users stat-icon stat-icon-blue"></i>
      <div class="stat-details">
        <span class="stat-value">{{ users }}</span>
        <span class="stat-label">Utilisateurs</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-book stat-icon stat-icon-purple"></i>
      <div class="stat-details">
        <span class="stat-value">{{ content }}</span>
        <span class="stat-label">Contenus</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Cartes de statistiques d'AdminInstitutions (#G1 ≤300). Présentation pure : 4 compteurs. */
defineProps({
  total: { type: Number, default: 0 },
  active: { type: Number, default: 0 },
  users: { type: Number, default: 0 },
  content: { type: Number, default: 0 },
})
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-icon {
  font-size: 1.5rem;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--indigo-500), var(--indigo-600));
  color: white;
  border-radius: var(--radius-lg);
}

.stat-icon-green {
  background: linear-gradient(135deg, var(--emerald-500), var(--emerald-600));
}

.stat-icon-blue {
  background: linear-gradient(135deg, var(--blue-500), var(--color-info-strong));
}

.stat-icon-purple {
  background: linear-gradient(135deg, var(--violet-500), var(--violet-600));
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
