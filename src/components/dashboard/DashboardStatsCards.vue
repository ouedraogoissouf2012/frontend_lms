<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="stat-card border-l-blue">
      <div class="stat-header">
        <UserGroupIcon class="stat-icon text-blue-600" />
        <p class="stat-label">Enseignants</p>
      </div>
      <p class="stat-value text-blue-600">
        {{ stats?.nb_enseignants || 0 }}
      </p>
    </div>

    <div class="stat-card border-l-green">
      <div class="stat-header">
        <AcademicCapIcon class="stat-icon text-green-600" />
        <p class="stat-label">Étudiants</p>
      </div>
      <p class="stat-value text-green-600">
        {{ stats?.nb_etudiants || 0 }}
      </p>
    </div>

    <div class="stat-card border-l-purple">
      <div class="stat-header">
        <BuildingLibraryIcon class="stat-icon text-purple-600" />
        <p class="stat-label">Classes actives</p>
      </div>
      <p class="stat-value text-purple-600">
        {{ stats?.nb_classes_actives || 0 }}
      </p>
    </div>

    <div class="stat-card border-l-orange">
      <div class="stat-header">
        <BookOpenIcon class="stat-icon text-orange-600" />
        <p class="stat-label">Matières</p>
      </div>
      <p class="stat-value text-orange-600">
        {{ stats?.nb_matieres_actives || 0 }}
      </p>
    </div>
  </div>
</template>

<script setup>
/** Cartes KPI d'AdminDashboard (#H3 ≤300). Présentation pure : 4 compteurs. */
import {
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  BookOpenIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, default: () => ({}) },
})
</script>

<style scoped>
/* Stat cards */
.stat-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid transparent;
}

.border-l-blue {
  border-left-color: var(--blue-500);
}

.border-l-green {
  border-left-color: var(--emerald-500);
}

.border-l-purple {
  border-left-color: var(--violet-500);
}

.border-l-orange {
  border-left-color: var(--amber-500);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
