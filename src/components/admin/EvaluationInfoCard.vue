<template>
  <div class="info-card">
    <h3 class="info-title">Informations de l'évaluation</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Enseignant:</span>
        <span class="info-value">{{ evaluation?.enseignant_nom || 'N/A' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date:</span>
        <span class="info-value">{{ formatDate(evaluation?.date_evaluation) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Durée:</span>
        <span class="info-value">{{ evaluation?.duree_minutes }} minutes</span>
      </div>
      <div class="info-item">
        <span class="info-label">Questions:</span>
        <span class="info-value">{{ evaluation?.questions_count || 0 }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Type:</span>
        <span class="info-value">{{ evaluation?.type || 'N/A' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Coefficient:</span>
        <span class="info-value">{{ evaluation?.coefficient || 1 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte « Informations de l'évaluation » d'AdminEvaluationDetails (#H3 ≤300).
 * Présentation pure : champs de l'évaluation (prop). Le formatage de date est
 * injecté via la prop formatDate pour conserver une parité exacte avec la vue.
 */
defineProps({
  evaluation: { type: Object, default: null },
  formatDate: { type: Function, required: true },
})
</script>

<style scoped>
/* Info Card */
.info-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
}

.info-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
}
</style>
