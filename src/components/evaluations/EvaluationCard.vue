<template>
  <div class="evaluation-card">
    <!-- Header -->
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

    <!-- Info Grid -->
    <div class="eval-info-grid">
      <div class="info-item">
        <BookOpenIcon class="info-icon" />
        <div>
          <p class="info-label">Matière</p>
          <p class="info-value">
            {{ evaluation.matiere?.nom || evaluation.matiere?.name || 'Non définie' }}
          </p>
        </div>
      </div>

      <div class="info-item">
        <UserGroupIcon class="info-icon" />
        <div>
          <p class="info-label">Classe</p>
          <p class="info-value">
            {{ evaluation.classe?.nom || evaluation.classe?.name || evaluation.classe?.libelle || 'Non définie' }}
          </p>
        </div>
      </div>

      <div class="info-item">
        <CalendarIcon class="info-icon" />
        <div>
          <p class="info-label">Date</p>
          <p class="info-value">
            {{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}
          </p>
        </div>
      </div>

      <div class="info-item">
        <ClockIcon class="info-icon" />
        <div>
          <p class="info-label">Coefficient / Barème</p>
          <p class="info-value">
            {{ evaluation.programmation?.coefficient || evaluation.coefficient || 1 }} -
            {{ evaluation.programmation?.bareme || evaluation.bareme || 20 }}/20
          </p>
        </div>
      </div>
    </div>

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

    <!-- Actions -->
    <div class="eval-actions">
      <button
        v-if="!evaluation.has_online"
        @click="$emit('create', evaluation)"
        class="btn-action btn-create"
        title="Créer une version interactive avec QCM pour cette évaluation KLASSCI"
      >
        <PlusIcon class="w-5 h-5" />
        Créer version en ligne
      </button>
      <button
        v-else
        @click="$emit('edit', evaluation)"
        class="btn-action btn-edit"
        title="Modifier les questions de la version en ligne"
      >
        <PencilIcon class="w-5 h-5" />
        Modifier les questions
      </button>
      <button
        v-if="evaluation.has_online && evaluation.online_version?.submissions_count > 0"
        @click="$emit('view-results', evaluation)"
        class="btn-action btn-view-results"
        title="Voir les notes et résultats des étudiants"
      >
        <ChartBarIcon class="w-5 h-5" />
        Voir les notes
      </button>
      <button
        v-if="evaluation.has_online && !evaluation.online_version?.is_published"
        @click="$emit('publish', evaluation)"
        class="btn-action btn-publish"
        title="Publier l'évaluation pour la rendre visible aux étudiants"
      >
        <MegaphoneIcon class="w-5 h-5" />
        Publier
      </button>
      <button
        v-if="evaluation.has_online"
        @click="$emit('preview', evaluation)"
        class="btn-action btn-preview"
        title="Prévisualiser l'évaluation"
      >
        <EyeIcon class="w-5 h-5" />
        Prévisualiser
      </button>
      <button
        v-if="evaluation.has_online && evaluation.online_version?.submissions_count > 0"
        @click="$emit('sync', evaluation)"
        :disabled="syncing === evaluation.id"
        class="btn-action btn-sync"
        title="Synchroniser les notes vers KLASSCI"
      >
        <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': syncing === evaluation.id }" />
        {{ syncing === evaluation.id ? 'Synchronisation...' : 'Synchroniser les notes' }}
      </button>
      <button
        v-if="evaluation.has_online && !evaluation.online_version?.is_locked && !(evaluation.online_version?.submissions_count > 0)"
        @click="$emit('delete', evaluation)"
        class="btn-action btn-delete"
        title="Supprimer la version en ligne"
      >
        <TrashIcon class="w-5 h-5" />
        Supprimer
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte d'une évaluation enseignant (#28, tranche 3).
 * Sous-composant de présentation extrait de TeacherEvaluations.vue.
 * Émet les intentions d'action ; la logique métier reste dans la vue parente.
 */
import {
  DocumentTextIcon,
  BookOpenIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  PlusIcon,
  PencilIcon,
  ArrowPathIcon,
  ChartBarIcon,
  EyeIcon,
  MegaphoneIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { getStatusLabel, getStatusTooltip, getStatusBadgeClass } from '@/utils/evaluations'

defineProps({
  evaluation: { type: Object, required: true },
  // id de l'évaluation en cours de synchronisation (ou null)
  syncing: { type: [Number, String, null], default: null }
})

defineEmits(['create', 'edit', 'view-results', 'publish', 'preview', 'sync', 'delete'])

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

// Format date (identique à l'ex-vue ; migration vers formatDateTime = dette #23).
function formatDate(date) {
  if (!date) return 'Non définie'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.evaluation-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.evaluation-card:hover {
  box-shadow: var(--card-shadow-hover);
}

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
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.status-badge-active {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
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
  background: #fef3c7;
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

/* Info Grid */
.eval-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

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
  background: #eff6ff;
  border: 1px solid #bfdbfe;
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
  color: #1e40af;
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
  color: #1e40af;
}

/* Actions */
.eval-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-create {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-create:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background: #d97706;
}

.btn-view-results {
  background: #8b5cf6;
  color: white;
}

.btn-view-results:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-sync {
  background: #22c55e;
  color: white;
}

.btn-sync:hover:not(:disabled) {
  background: #16a34a;
}

.btn-publish {
  background: #8b5cf6;
  color: white;
}

.btn-publish:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-preview {
  background: #6366f1;
  color: white;
}

.btn-preview:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
