<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="stat-card">
      <div class="stat-header">
        <BookOpenIcon class="stat-icon text-blue-600" />
        <p class="stat-label">Matières Enseignées</p>
      </div>
      <p class="stat-value text-blue-600">
        {{ dashboardData.matieres?.length || 0 }}
      </p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <UserGroupIcon class="stat-icon text-green-600" />
        <p class="stat-label">Classes</p>
      </div>
      <p class="stat-value text-green-600">
        {{ dashboardData.classes?.length || 0 }}
      </p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <DocumentTextIcon class="stat-icon text-orange-600" />
        <p class="stat-label">Évaluations</p>
      </div>
      <p class="stat-value text-orange-600">
        {{ dashboardData.evaluations?.length || 0 }}
      </p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <CalendarIcon class="stat-icon text-purple-600" />
        <p class="stat-label">Séances à venir</p>
      </div>
      <p class="stat-value text-purple-600">
        {{ dashboardData.seances?.length || 0 }}
      </p>
    </div>
  </div>
</template>

<script setup>
/** Cartes de statistiques principales du dashboard enseignant (#H11 ≤300).
 *  Présentation pure : 4 compteurs (matières, classes, évaluations, séances). */
import { BookOpenIcon, UserGroupIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/vue/24/outline'

defineProps({
  dashboardData: { type: Object, required: true }
})
</script>

<style scoped>
/* Stat cards */
.stat-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
