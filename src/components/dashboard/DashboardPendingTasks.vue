<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <ExclamationCircleIcon class="widget-icon text-orange-600" />
      <h2 class="widget-title">Tâches en Attente</h2>
    </div>
    <div class="pending-tasks-grid">
      <div v-if="pendingTasks.pending_grading?.count > 0" class="task-item urgent">
        <div class="task-icon">
          <DocumentTextIcon class="w-5 h-5 text-red-600" />
        </div>
        <div class="task-content">
          <p class="task-count">{{ pendingTasks.pending_grading.count }}</p>
          <p class="task-label">Evaluations non notées</p>
          <p v-if="pendingTasks.pending_grading.urgent_count > 0" class="task-urgent">
            {{ pendingTasks.pending_grading.urgent_count }} urgentes (>3j)
          </p>
        </div>
      </div>

      <div v-if="pendingTasks.inactive_users?.count > 0" class="task-item">
        <div class="task-icon">
          <ClockIcon class="w-5 h-5 text-orange-600" />
        </div>
        <div class="task-content">
          <p class="task-count">{{ pendingTasks.inactive_users.count }}</p>
          <p class="task-label">Utilisateurs inactifs (30j)</p>
        </div>
      </div>

      <div v-if="pendingTasks.unpublished_evaluations?.count > 0" class="task-item">
        <div class="task-icon">
          <DocumentTextIcon class="w-5 h-5 text-gray-600" />
        </div>
        <div class="task-content">
          <p class="task-count">{{ pendingTasks.unpublished_evaluations.count }}</p>
          <p class="task-label">Evaluations non publiées</p>
        </div>
      </div>

      <div v-if="pendingTasks.draft_lessons?.count > 0" class="task-item">
        <div class="task-icon">
          <BookOpenIcon class="w-5 h-5 text-gray-600" />
        </div>
        <div class="task-content">
          <p class="task-count">{{ pendingTasks.draft_lessons.count }}</p>
          <p class="task-label">Leçons en brouillon</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Widget tâches en attente d'AdminDashboard (#H3 ≤300). Présentation pure. */
import {
  BookOpenIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

defineProps({
  pendingTasks: { type: Object, default: () => ({}) },
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
  flex: 1;
}

/* Pending Tasks Grid */
.pending-tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  border-left: 4px solid #d1d5db;
  transition: all 0.2s;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-item.urgent {
  border-left-color: var(--red-500);
  background: linear-gradient(135deg, var(--red-50) 0%, var(--error-bg) 100%);
}

.task-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-content {
  flex: 1;
}

.task-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.task-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.task-urgent {
  font-size: 0.75rem;
  color: var(--red-600);
  font-weight: 600;
  margin: 0.25rem 0 0 0;
}

@media (max-width: 768px) {
  .pending-tasks-grid {
    grid-template-columns: 1fr;
  }
}
</style>
