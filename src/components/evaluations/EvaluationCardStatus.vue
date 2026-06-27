<template>
  <!-- Window Status -->
  <div v-if="evaluation.programmation?.window" class="window-status">
    <div v-if="!evaluation.programmation.window.has_started" class="status-item status-pending">
      <ClockIcon class="status-icon" />
      <div>
        <p class="status-text">Prévue</p>
        <p class="status-detail">L'évaluation n'a pas encore commencé</p>
      </div>
    </div>
    <div v-else-if="evaluation.programmation.window.is_open" class="status-item status-active">
      <span class="pulse-dot"></span>
      <div>
        <p class="status-text">En cours</p>
        <p class="status-detail">{{ evaluation.programmation.window.time_left_minutes }} minutes restantes</p>
      </div>
    </div>
    <div v-else class="status-item status-finished">
      <CheckCircleIcon class="status-icon" />
      <div>
        <p class="status-text">Terminée</p>
        <p class="status-detail">La fenêtre de composition est fermée</p>
      </div>
    </div>
  </div>

  <!-- Online Version Info -->
  <div v-if="evaluation.has_online && evaluation.online_version" class="online-info">
    <ComputerDesktopIcon class="online-icon" />
    <div class="online-details">
      <p class="online-title">Version en ligne configurée</p>
      <div class="online-stats">
        <span class="online-stat">
          <DocumentTextIcon class="w-4 h-4" />
          {{ evaluation.online_version.questions_count || 0 }} questions
        </span>
        <span class="online-stat">
          <ClockIcon class="w-4 h-4" />
          {{ evaluation.online_version.duree_minutes }} min
        </span>
        <span class="online-stat">
          <UserGroupIcon class="w-4 h-4" />
          {{ evaluation.online_version.submissions_count || 0 }} soumissions
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Statut de fenêtre + bloc « version en ligne » d'EvaluationCard (H2 ≤300).
 * Deux sections présentationnelles (chacune sous v-if) extraites verbatim ;
 * racines multiples (fragment) → DOM identique à l'original sous .evaluation-card.
 */
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

defineProps({
  evaluation: { type: Object, required: true }
})
</script>

<style scoped>
/* Window Status */
.window-status {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 3px solid;
  background: var(--card-bg);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-pending {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}

.status-pending .status-icon {
  color: #f59e0b;
}

.status-pending .status-text {
  color: #d97706;
}

.status-pending .status-detail {
  color: var(--text-secondary);
}

.status-active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.status-active .status-text {
  color: #059669;
}

.status-active .status-detail {
  color: var(--text-secondary);
}

.status-finished {
  border-color: #6b7280;
  background: rgba(107, 114, 128, 0.05);
}

.status-finished .status-icon {
  color: #6b7280;
}

.status-finished .status-text {
  color: #4b5563;
}

.status-finished .status-detail {
  color: var(--text-secondary);
}

.status-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.pulse-dot {
  width: 0.75rem;
  height: 0.75rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.125rem 0;
}

.status-detail {
  font-size: 0.8125rem;
  opacity: 0.8;
  margin: 0;
}

/* Online Info */
.online-info {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--blue-50);
  border: 1px solid var(--blue-200);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.online-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #2563eb;
  flex-shrink: 0;
}

.online-details {
  flex: 1;
}

.online-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--info-text);
  margin: 0 0 0.5rem 0;
}

.online-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.online-stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--info-text);
}
</style>
