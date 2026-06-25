<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="stat-card">
      <div class="stat-icon-wrapper bg-blue-100">
        <BookOpenIcon class="stat-icon text-blue-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Matières Enseignées</p>
        <p class="stat-value">{{ stats.nb_matieres || 0 }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-green-100">
        <UserGroupIcon class="stat-icon text-green-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Total Étudiants</p>
        <p class="stat-value">{{ stats.nb_etudiants || 0 }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-orange-100">
        <DocumentTextIcon class="stat-icon text-orange-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Évaluations Créées</p>
        <p class="stat-value">{{ stats.nb_evaluations || 0 }}</p>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-purple-100">
        <CalendarIcon class="stat-icon text-purple-600" />
      </div>
      <div class="stat-content">
        <p class="stat-label">Séances Données</p>
        <p class="stat-value">{{ stats.nb_seances || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Cartes globales des statistiques enseignant (#H11 ≤300). Présentation pure :
 *  4 compteurs (matières, étudiants, évaluations, séances). */
import { BookOpenIcon, UserGroupIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, required: true }
})
</script>

<style scoped>
/* Stat Cards */
.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.stat-icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-blue-100 {
  background: #dbeafe;
}

.bg-green-100 {
  background: #dcfce7;
}

.bg-orange-100 {
  background: #ffedd5;
}

.bg-purple-100 {
  background: #f3e8ff;
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
</style>
