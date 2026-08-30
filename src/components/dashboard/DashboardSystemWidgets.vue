<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <!-- Widget Activité Système -->
    <div class="widget-card">
      <div class="widget-header">
        <ChartBarIcon class="widget-icon text-indigo-600" />
        <h2 class="widget-title">Activité Système</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <p class="stat-label">Séances Actives</p>
          <p class="stat-value text-purple-600" :title="notMeasuredHint(stats?.nb_seances_actives)">
            {{ display(stats?.nb_seances_actives) }}
          </p>
        </div>
        <div class="stat-item">
          <p class="stat-label">Évaluations Totales</p>
          <p class="stat-value text-orange-600" :title="notMeasuredHint(stats?.nb_evaluations)">
            {{ display(stats?.nb_evaluations) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Widget Gestion -->
    <div class="widget-card">
      <div class="widget-header">
        <BuildingLibraryIcon class="widget-icon text-blue-600" />
        <h2 class="widget-title">Vue d'Ensemble</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <p class="stat-label">Filières</p>
          <p class="stat-value text-blue-600" :title="notMeasuredHint(stats?.nb_filieres)">
            {{ display(stats?.nb_filieres) }}
          </p>
        </div>
        <div class="stat-item">
          <p class="stat-label">Niveaux</p>
          <p class="stat-value text-green-600" :title="notMeasuredHint(stats?.nb_niveaux)">
            {{ display(stats?.nb_niveaux) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/** Widgets Activité Système + Vue d'Ensemble d'AdminDashboard (#H3 ≤300). */
import {
  BuildingLibraryIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

defineProps({
  stats: { type: Object, default: () => ({}) },
})

const NOT_MEASURED = '—'

/**
 * Affiche la valeur si elle a été MESURÉE, sinon un tiret.
 *
 * L'ancien `{{ stats?.x || 0 }}` rendait `0` aussi bien pour « mesuré à zéro »
 * que pour « jamais mesuré » (et même pour « donnée absente ») : une métrique
 * qu'aucune source n'alimente s'affichait comme un zéro crédible. Un compteur
 * réellement nul reste bien rendu « 0 » — seul l'inconnu devient « — ».
 */
const display = (value) => (Number.isFinite(value) ? value : NOT_MEASURED)

/** Infobulle expliquant le tiret (vide quand la valeur est mesurée). */
const notMeasuredHint = (value) =>
  Number.isFinite(value) ? '' : 'Donnée non disponible pour le moment'
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

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-item .stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-item .stat-value {
  font-size: 2rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
