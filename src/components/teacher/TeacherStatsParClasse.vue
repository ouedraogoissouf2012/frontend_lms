<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <BuildingLibraryIcon class="widget-icon text-green-600" />
      <h2 class="widget-title">Répartition par Classe</h2>
    </div>
    <div v-if="classes && classes.length > 0" class="classes-grid">
      <div
        v-for="classe in classes"
        :key="classe.id"
        class="classe-stat-card"
      >
        <div class="classe-header">
          <h3 class="classe-name">{{ classe.nom }}</h3>
          <span class="classe-badge">{{ classe.niveau }}</span>
        </div>
        <div class="classe-stats-row">
          <div class="classe-stat">
            <UserGroupIcon class="w-4 h-4 text-gray-500" />
            <span>{{ classe.nb_etudiants || 0 }} étudiants</span>
          </div>
          <div class="classe-stat">
            <BookOpenIcon class="w-4 h-4 text-gray-500" />
            <span>{{ classe.nb_matieres || 0 }} matières</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state-small">
      <p class="empty-message">Aucune classe assignée</p>
    </div>
  </div>
</template>

<script setup>
/** Widget « Répartition par classe » des statistiques enseignant (#H11 ≤300).
 *  Présentation pure : carte par classe (niveau, étudiants, matières). */
import { BuildingLibraryIcon, UserGroupIcon, BookOpenIcon } from '@heroicons/vue/24/outline'

defineProps({
  classes: { type: Array, default: () => [] }
})
</script>

<style scoped>
/* Widget Card */
.widget-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
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
}

/* Classes Grid */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.classe-stat-card {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.classe-stat-card:hover {
  background: var(--bg-tertiary);
}

.classe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.classe-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.classe-badge {
  padding: 0.25rem 0.5rem;
  background: #e0e7ff;
  color: #5b21b6;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.classe-stats-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.classe-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Empty State Small */
.empty-state-small {
  text-align: center;
  padding: 2rem;
}

.empty-message {
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .classes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
