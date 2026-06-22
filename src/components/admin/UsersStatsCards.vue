<template>
  <div class="stats-grid">
    <div class="stat-card">
      <i class="fa fa-users stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ total }}</span>
        <span class="stat-label">Total Utilisateurs</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-graduation-cap stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ etudiants }}</span>
        <span class="stat-label">Étudiants</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-user stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ enseignants }}</span>
        <span class="stat-label">Enseignants</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-building stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ classes }}</span>
        <span class="stat-label">Classes</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Cartes de statistiques d'AdminUsers (#G1 ≤300). Présentation pure : 4 compteurs. */
defineProps({
  total: { type: Number, default: 0 },
  etudiants: { type: Number, default: 0 },
  enseignants: { type: Number, default: 0 },
  classes: { type: Number, default: 0 },
})
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-icon {
  font-size: 2rem;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: var(--radius-lg);
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
