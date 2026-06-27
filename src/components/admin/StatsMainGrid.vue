<template>
  <div class="stats-grid-main">
    <!-- Utilisateurs -->
    <div class="stat-card-large blue">
      <div class="stat-header">
        <UserGroupIcon class="stat-icon" />
        <h3 class="stat-title">Utilisateurs</h3>
      </div>
      <div class="stat-body">
        <div class="stat-row">
          <span class="stat-label">Enseignants</span>
          <span class="stat-value">{{ stats.nb_enseignants || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Étudiants</span>
          <span class="stat-value">{{ stats.nb_etudiants || 0 }}</span>
        </div>
        <div class="stat-row total">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ (stats.nb_enseignants || 0) + (stats.nb_etudiants || 0) }}</span>
        </div>
      </div>
    </div>

    <!-- Classes & Matières -->
    <div class="stat-card-large purple">
      <div class="stat-header">
        <BuildingLibraryIcon class="stat-icon" />
        <h3 class="stat-title">Classes & Matières</h3>
      </div>
      <div class="stat-body">
        <div class="stat-row">
          <span class="stat-label">Classes actives</span>
          <span class="stat-value">{{ stats.nb_classes_actives || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Matières actives</span>
          <span class="stat-value">{{ stats.nb_matieres_actives || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Filières</span>
          <span class="stat-value">{{ stats.nb_filieres || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Niveaux</span>
          <span class="stat-value">{{ stats.nb_niveaux || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Séances & Visio -->
    <div class="stat-card-large green">
      <div class="stat-header">
        <CalendarIcon class="stat-icon" />
        <h3 class="stat-title">Séances & Visioconférences</h3>
      </div>
      <div class="stat-body">
        <div class="stat-row">
          <span class="stat-label">Séances actives</span>
          <span class="stat-value">{{ stats.nb_seances_actives || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Visios en cours</span>
          <span class="stat-value">{{ stats.nb_visios_actives || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Visios planifiées</span>
          <span class="stat-value">{{ stats.nb_visios_scheduled || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- Évaluations -->
    <div class="stat-card-large orange">
      <div class="stat-header">
        <DocumentTextIcon class="stat-icon" />
        <h3 class="stat-title">Évaluations</h3>
      </div>
      <div class="stat-body">
        <div class="stat-row">
          <span class="stat-label">Total évaluations</span>
          <span class="stat-value">{{ stats.nb_evaluations || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">En cours</span>
          <span class="stat-value">{{ stats.nb_evaluations_actives || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Terminées</span>
          <span class="stat-value">{{ stats.nb_evaluations_terminees || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Grille principale d'AdminStats (#H3 ≤300). Présentation pure : 4 cartes larges
 * (utilisateurs, classes/matières, séances/visio, évaluations). Données en prop.
 */
import {
  UserGroupIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, default: () => ({}) },
})
</script>

<style scoped>
/* Main Stats Grid */
.stats-grid-main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card-large {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border-left: 4px solid;
}

.stat-card-large.blue {
  border-left-color: var(--blue-500);
}

.stat-card-large.purple {
  border-left-color: var(--violet-500);
}

.stat-card-large.green {
  border-left-color: var(--emerald-500);
}

.stat-card-large.orange {
  border-left-color: var(--amber-500);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-secondary);
}

.stat-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.stat-row.total {
  border-top: 1px solid var(--border-color);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-md);
  font-weight: 600;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .stats-grid-main {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}
</style>
