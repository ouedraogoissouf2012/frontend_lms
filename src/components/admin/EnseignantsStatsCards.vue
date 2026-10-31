<template>
  <div class="stats-grid">
    <div class="stat-card">
      <i class="fa fa-user stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value"><CountValue :value="enseignants" /></span>
        <span class="stat-label">Enseignants</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-book stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value"><CountValue :value="totalMatieres" /></span>
        <span class="stat-label">Matières Assignées</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-building stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value"><CountValue :value="totalClasses" /></span>
        <span class="stat-label">Classes Assignées</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-sun-o stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value"><CountValue :value="actifs" /></span>
        <span class="stat-label">Actifs</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes de statistiques d'AdminEnseignants (#G1 ≤300). Présentation pure : 4 compteurs.
 * `null` = non mesuré (liste jamais chargée) : rendu « — », jamais 0.
 */
import CountValue from '@/components/common/CountValue.vue'

defineProps({
  enseignants: { type: Number, default: null },
  totalMatieres: { type: Number, default: null },
  totalClasses: { type: Number, default: null },
  actifs: { type: Number, default: null },
})
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}
</style>
