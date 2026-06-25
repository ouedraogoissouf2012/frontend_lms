<template>
  <div class="widget-card">
    <div class="widget-header">
      <ChartBarIcon class="widget-icon text-indigo-600" />
      <h2 class="widget-title">Performance par Matière</h2>
    </div>
    <div v-if="matieres && matieres.length > 0" class="space-y-3">
      <div
        v-for="matiere in matieres"
        :key="matiere.id"
        class="matiere-stat-item"
      >
        <div class="matiere-info">
          <p class="matiere-name">{{ matiere.nom }}</p>
          <p class="matiere-detail">{{ matiere.nb_classes || 0 }} classe(s)</p>
        </div>
        <div class="matiere-stats">
          <div class="mini-stat">
            <span class="mini-stat-value">{{ matiere.nb_etudiants || 0 }}</span>
            <span class="mini-stat-label">étudiants</span>
          </div>
          <div class="mini-stat">
            <span class="mini-stat-value">{{ matiere.nb_evaluations || 0 }}</span>
            <span class="mini-stat-label">éval.</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state-small">
      <p class="empty-message">Aucune donnée disponible</p>
    </div>
  </div>
</template>

<script setup>
/** Widget « Performance par matière » des statistiques enseignant (#H11 ≤300).
 *  Présentation pure : liste matières + mini-stats (étudiants, évaluations). */
import { ChartBarIcon } from '@heroicons/vue/24/outline'

defineProps({
  matieres: { type: Array, default: () => [] }
})
</script>

<style scoped>
/* Widget Card */
.widget-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Matiere Stats */
.matiere-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.matiere-stat-item:hover {
  background: var(--bg-tertiary);
}

.matiere-info {
  flex: 1;
}

.matiere-name {
  font-size: 0.938rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.matiere-detail {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.matiere-stats {
  display: flex;
  gap: 1.5rem;
}

.mini-stat {
  text-align: center;
}

.mini-stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.mini-stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Empty State Small */
.empty-state-small {
  text-align: center;
  padding: 2rem;
}

.empty-message {
  color: var(--text-secondary);
}
</style>
