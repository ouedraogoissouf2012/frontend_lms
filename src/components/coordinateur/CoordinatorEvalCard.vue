<template>
  <div class="evaluation-card">
    <div class="evaluation-header">
      <div class="evaluation-title-section">
        <h3 class="evaluation-title">{{ evaluation.titre }}</h3>
        <div class="evaluation-meta">
          <span class="meta-badge meta-enseignant">
            <UserIcon class="w-3 h-3" />
            {{ teacherName(evaluation) }}
          </span>
          <span class="meta-badge meta-matiere">
            <BookOpenIcon class="w-3 h-3" />
            {{ matiereName(evaluation) }}
          </span>
          <span class="meta-badge meta-classe">
            <UserGroupIcon class="w-3 h-3" />
            {{ classeName(evaluation) }}
          </span>
        </div>
      </div>
      <span :class="getStatusClass(evaluation.effective_status || evaluation.status)" class="status-badge">
        {{ getStatusLabel(evaluation.effective_status || evaluation.status) }}
      </span>
    </div>

    <div class="evaluation-stats">
      <div class="stat-item">
        <CalendarIcon class="stat-item-icon" />
        <span>{{ formatDate(evaluation.date_evaluation) }}</span>
      </div>
      <div class="stat-item">
        <ClockIcon class="stat-item-icon" />
        <span>{{ evaluation.duree_minutes }} min</span>
      </div>
      <div class="stat-item">
        <DocumentTextIcon class="stat-item-icon" />
        <span>{{ evaluation.questions_count || 0 }} questions</span>
      </div>
      <div class="stat-item">
        <UserGroupIcon class="stat-item-icon" />
        <span>{{ evaluation.submissions_count || 0 }} soumissions</span>
      </div>
    </div>

    <div class="evaluation-actions">
      <button @click="$emit('view-results', evaluation.id)" class="btn-primary">
        <ChartBarIcon class="w-4 h-4" />
        Voir résultats
      </button>
      <button
        @click="$emit('view-details', evaluation.id)"
        class="btn-secondary"
        :disabled="!isEvaluationTerminee(evaluation)"
        :class="{ 'btn-disabled': !isEvaluationTerminee(evaluation) }"
        :title="!isEvaluationTerminee(evaluation) ? 'Accessible uniquement pour les évaluations terminées' : ''"
      >
        <EyeIcon class="w-4 h-4" />
        Détails
        <svg v-if="!isEvaluationTerminee(evaluation)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import {
  UserIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'
import { classeName, matiereName, teacherName } from '@/utils/evaluationDisplay'

defineProps({
  evaluation: { type: Object, required: true }
})

defineEmits(['view-results', 'view-details'])

const isEvaluationTerminee = (evaluation) => {
  // Utilise le statut effectif calculé par le backend (date + durée)
  // Si pas de effective_status, fallback sur status
  const effectiveStatus = evaluation.effective_status || evaluation.status
  return effectiveStatus === 'terminee'
}

const getStatusClass = (status) => {
  const classes = {
    'brouillon': 'status-draft',
    'planifiee': 'status-planned',
    'en_cours': 'status-active',
    'terminee': 'status-completed'
  }
  return classes[status] || 'status-draft'
}

const getStatusLabel = (status) => {
  const labels = {
    'brouillon': 'Brouillon',
    'planifiee': 'Planifiée',
    'en_cours': 'En cours',
    'terminee': 'Terminée'
  }
  return labels[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<style scoped>
.evaluation-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.evaluation-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.evaluation-title-section {
  flex: 1;
}

.evaluation-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
}

.evaluation-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.meta-enseignant {
  background: var(--primary-light);
  color: var(--primary);
}

.meta-matiere {
  background: var(--success-light);
  color: var(--success);
}

.meta-classe {
  background: var(--warning-light);
  color: var(--warning);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-draft {
  background: var(--neutral-light);
  color: var(--text-secondary);
}

.status-planned {
  background: var(--info-light);
  color: var(--info);
}

.status-active {
  background: var(--success-light);
  color: var(--success);
}

.status-completed {
  background: var(--primary-light);
  color: var(--primary);
}

.evaluation-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-item-icon {
  width: 1rem;
  height: 1rem;
}

.evaluation-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all var(--transition-fast);
  border: none;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover {
  background: var(--hover-bg);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
  pointer-events: none;
  background: var(--neutral-light) !important;
  color: var(--text-secondary) !important;
  border-color: var(--border-light) !important;
}

.btn-disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}
</style>
