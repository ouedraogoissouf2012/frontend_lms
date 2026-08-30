<template>
  <div class="stats-grid">
    <div class="stat-card">
      <i class="fa fa-users stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ formatCount(total) }}</span>
        <span class="stat-label">Total Utilisateurs</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-graduation-cap stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ formatCount(etudiants) }}</span>
        <span class="stat-label">Étudiants</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-user stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ formatCount(enseignants) }}</span>
        <span class="stat-label">Enseignants</span>
      </div>
    </div>
    <div class="stat-card">
      <i class="fa fa-building stat-icon"></i>
      <div class="stat-details">
        <span class="stat-value">{{ formatCount(classes) }}</span>
        <span class="stat-label">Classes</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Cartes de statistiques d'AdminUsers (#G1 ≤300). Présentation pure : 4 compteurs. */
import { formatCount } from '@/utils/formatters'

// `null` = NON MESURÉ (la ressource n'a pas répondu) → rendu « — ». Le défaut
// était 0, ce qui présentait une panne de chargement comme un comptage nul :
// l'écran affichait « 0 Étudiants » alors qu'aucun appel n'avait abouti.
defineProps({
  total: { type: Number, default: null },
  etudiants: { type: Number, default: null },
  enseignants: { type: Number, default: null },
  classes: { type: Number, default: null },
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
