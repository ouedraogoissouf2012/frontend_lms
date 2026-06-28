<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <DocumentTextIcon class="widget-icon text-orange-600" />
      <h2 class="widget-title">Évaluations à venir</h2>
    </div>
    <div class="space-y-3">
      <div
        v-for="evaluation in evaluations"
        :key="evaluation.id"
        class="evaluation-item"
      >
        <div class="evaluation-info">
          <h3 class="evaluation-title">{{ evaluation.titre || evaluation.name }}</h3>
          <p class="evaluation-meta">{{ evaluation.matiere?.name || evaluation.classe?.name }}</p>
          <p class="evaluation-date">Date: {{ formatDate(evaluation.date) }}</p>
        </div>
        <span
          :class="{
            'badge-success': evaluation.statut === 'planifie',
            'badge-info': evaluation.statut === 'en_cours',
            'badge-default': evaluation.statut === 'termine'
          }"
          class="evaluation-badge"
        >
          {{ evaluation.statut }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Widget « Évaluations à venir » du dashboard enseignant (#H11 ≤300).
 *  Présentation pure : liste d'évaluations + badge de statut. */
import { DocumentTextIcon } from '@heroicons/vue/24/outline'

defineProps({
  evaluations: { type: Array, default: () => [] },
  formatDate: { type: Function, required: true }
})
</script>

<style scoped>
/* Widget card */
.widget-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
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

/* Evaluation item */
.evaluation-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.evaluation-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.evaluation-info {
  flex: 1;
}

.evaluation-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.evaluation-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.evaluation-date {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

.evaluation-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-success {
  background: var(--success-bg);
  color: var(--success-text);
}

.badge-info {
  background: var(--info-bg);
  color: var(--info-text);
}

.badge-default {
  background: var(--gray-100);
  color: var(--gray-600);
}
</style>
