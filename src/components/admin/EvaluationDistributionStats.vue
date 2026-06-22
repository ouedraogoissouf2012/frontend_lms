<template>
  <div class="detailed-stats-grid">
    <div class="stat-detail-card">
      <h4 class="stat-detail-title">Distribution des notes</h4>
      <div class="distribution-list">
        <div class="distribution-item">
          <span class="distribution-label">Note min:</span>
          <span class="distribution-value">{{ (statistiques?.note_min !== null && statistiques?.note_min !== undefined) ? statistiques.note_min.toFixed(2) : '-' }}</span>
        </div>
        <div class="distribution-item">
          <span class="distribution-label">Note max:</span>
          <span class="distribution-value">{{ (statistiques?.note_max !== null && statistiques?.note_max !== undefined) ? statistiques.note_max.toFixed(2) : '-' }}</span>
        </div>
        <div class="distribution-item">
          <span class="distribution-label">Médiane:</span>
          <span class="distribution-value">{{ (statistiques?.mediane !== null && statistiques?.mediane !== undefined) ? statistiques.mediane.toFixed(2) : '-' }}</span>
        </div>
      </div>
    </div>

    <div class="stat-detail-card">
      <h4 class="stat-detail-title">Répartition</h4>
      <div class="distribution-list">
        <div class="distribution-item">
          <span class="distribution-label">Étudiants soumis:</span>
          <span class="distribution-value text-green-600">{{ statistiques?.etudiants_soumis || 0 }}</span>
        </div>
        <div class="distribution-item">
          <span class="distribution-label">En cours:</span>
          <span class="distribution-value text-orange-600">{{ statistiques?.etudiants_en_cours || 0 }}</span>
        </div>
        <div class="distribution-item">
          <span class="distribution-label">Non passés:</span>
          <span class="distribution-value text-red-600">{{ statistiques?.etudiants_non_passes || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Statistiques détaillées d'AdminEvaluationDetails (#H3 ≤300). Présentation pure :
 * distribution des notes (min/max/médiane) et répartition (soumis/en cours/non
 * passés) alimentées par l'objet statistiques (prop). Aucun appel API.
 */
defineProps({
  statistiques: { type: Object, default: null },
})
</script>

<style scoped>
/* Detailed Stats */
.detailed-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.stat-detail-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
}

.stat-detail-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.distribution-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.distribution-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.distribution-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
