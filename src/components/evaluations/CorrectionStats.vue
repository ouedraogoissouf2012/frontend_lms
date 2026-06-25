<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-header">
        <UserGroupIcon class="stat-icon text-blue-600" />
        <span class="stat-label">Total Étudiants</span>
      </div>
      <p class="stat-value">{{ statistiques.total_etudiants || 0 }}</p>
      <p class="stat-change">dans la classe</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <CheckCircleIcon class="stat-icon text-green-600" />
        <span class="stat-label">Ont composé</span>
      </div>
      <p class="stat-value">{{ statistiques.etudiants_soumis || 0 }}</p>
      <p class="stat-change">{{ statistiques.taux_participation || 0 }}% de participation</p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <ChartBarIcon class="stat-icon text-purple-600" />
        <span class="stat-label">Moyenne Classe</span>
      </div>
      <p class="stat-value">{{ statistiques.moyenne_classe || '-' }}<span v-if="statistiques.moyenne_classe" class="stat-unit">/20</span></p>
      <p class="stat-change">
        Min: {{ statistiques.note_min || '-' }} / Max: {{ statistiques.note_max || '-' }}
      </p>
    </div>

    <div class="stat-card">
      <div class="stat-header">
        <ClockIcon class="stat-icon text-orange-600" />
        <span class="stat-label">En cours</span>
      </div>
      <p class="stat-value">{{ statistiques.etudiants_en_cours || 0 }}</p>
      <p class="stat-change">étudiants</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Cartes de statistiques des résultats (corrections enseignant, H2 ≤300) :
 * total / ont composé / moyenne classe / en cours. Section présentationnelle
 * extraite verbatim. Reçoit les statistiques en prop.
 */
import { UserGroupIcon, CheckCircleIcon, ChartBarIcon, ClockIcon } from '@heroicons/vue/24/outline'

defineProps({
  statistiques: { type: Object, required: true }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.stat-unit {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.stat-change {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
