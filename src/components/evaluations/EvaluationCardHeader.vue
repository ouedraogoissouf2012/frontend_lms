<template>
  <div class="eval-header">
    <div class="eval-title-section">
      <h3 class="eval-title">{{ evaluation.titre }}</h3>
      <div class="eval-badges">
        <span
          :class="getStatusBadgeClass(evaluation)"
          class="status-badge"
          :title="getStatusTooltip(evaluation.status)"
        >
          <component :is="getStatusIcon(evaluation.status)" class="w-4 h-4" />
          {{ getStatusLabel(evaluation.status) }}
        </span>
        <span
          v-if="evaluation.has_online"
          class="online-badge"
          title="Cette évaluation dispose d'une version interactive en ligne avec QCM"
        >
          <CheckCircleIcon class="w-4 h-4" />
          Version en ligne
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tête d'EvaluationCard (H2 ≤300) : titre + badges de statut / version en ligne.
 * Section présentationnelle extraite verbatim d'EvaluationCard.vue. Prop seule.
 */
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'
import { getStatusLabel, getStatusTooltip, getStatusBadgeClass } from '@/utils/evaluations'

defineProps({
  evaluation: { type: Object, required: true }
})

// Mappe un statut vers son composant d'icône (réfère des composants → reste local).
function getStatusIcon(status) {
  const icons = {
    planifiee: CalendarIcon,
    en_cours: ClockIcon,
    terminee: CheckCircleIcon,
    brouillon: DocumentTextIcon,
    draft: DocumentTextIcon,
    in_progress: ClockIcon,
    completed: CheckCircleIcon
  }
  return icons[status] || DocumentTextIcon
}
</script>

<style scoped>
.eval-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.eval-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.eval-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.eval-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: help;
  transition: all 0.2s;
}

.status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-badge-planned {
  background: var(--info-bg);
  color: var(--info-text);
  border: 1px solid var(--blue-200);
}

.status-badge-active {
  background: var(--success-bg);
  color: var(--success-text);
  border: 1px solid var(--success-border);
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
  }
}

.status-badge-finished {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.status-badge-draft {
  background: var(--warning-bg);
  color: #92400e;
  border: 1px solid #fde68a;
}

.status-badge-default {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.online-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
  cursor: help;
  transition: all 0.2s;
}

.online-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}
</style>
