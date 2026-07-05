<template>
  <div class="stats-detail-grid">
    <div class="stat-detail-card">
      <i class="fa fa-building stat-detail-icon"></i>
      <div class="stat-detail-content">
        <span class="stat-detail-value">{{ safeStats.total_classes }}</span>
        <span class="stat-detail-label">Classes</span>
      </div>
    </div>
    <div class="stat-detail-card">
      <i class="fa fa-book stat-detail-icon"></i>
      <div class="stat-detail-content">
        <span class="stat-detail-value">{{ safeStats.total_matieres }}</span>
        <span class="stat-detail-label">Matières</span>
      </div>
    </div>
    <div class="stat-detail-card">
      <i class="fa fa-check-circle stat-detail-icon"></i>
      <div class="stat-detail-content">
        <span class="stat-detail-value">{{ safeStats.total_heures_effectuees }}h</span>
        <span class="stat-detail-label">Heures effectuées</span>
      </div>
    </div>
    <div class="stat-detail-card">
      <i class="fa fa-clock-o stat-detail-icon"></i>
      <div class="stat-detail-content">
        <span class="stat-detail-value">{{ safeStats.total_heures_prevues }}h</span>
        <span class="stat-detail-label">Heures prévues</span>
      </div>
    </div>
    <div class="stat-detail-card">
      <i class="fa fa-pie-chart stat-detail-icon"></i>
      <div class="stat-detail-content">
        <span class="stat-detail-value">{{ safeStats.taux_realisation_global.toFixed(1) }}%</span>
        <span class="stat-detail-label">Taux réalisation</span>
      </div>
    </div>
    <div class="stat-detail-card">
      <i class="fa fa-calendar-check-o stat-detail-icon"></i>
      <div class="stat-detail-content">
        <span class="stat-detail-value">{{ safeStats.nb_seances_effectuees }}/{{ safeStats.nb_seances_total }}</span>
        <span class="stat-detail-label">Séances</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Grille "Statistiques Globales" d'un enseignant (#G1 décompo — extraite d'EnseignantDetailModal).
 * Présentationnel pur : reçoit l'objet statistiques, aucun état interne ni émission.
 */
const props = defineProps({ stats: { type: Object, required: true } })

const numberOrZero = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const safeStats = computed(() => ({
  total_classes: numberOrZero(props.stats?.total_classes),
  total_matieres: numberOrZero(props.stats?.total_matieres),
  total_heures_effectuees: numberOrZero(props.stats?.total_heures_effectuees),
  total_heures_prevues: numberOrZero(props.stats?.total_heures_prevues),
  taux_realisation_global: numberOrZero(props.stats?.taux_realisation_global),
  nb_seances_effectuees: numberOrZero(props.stats?.nb_seances_effectuees),
  nb_seances_total: numberOrZero(props.stats?.nb_seances_total),
}))
</script>

<style scoped lang="scss">
/* Stats Detail Grid */
.stats-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.stat-detail-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-detail-icon {
  font-size: 1.5rem;
}

.stat-detail-content {
  display: flex;
  flex-direction: column;
}

.stat-detail-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-detail-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

@media (max-width: 768px) {
  .stats-detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
