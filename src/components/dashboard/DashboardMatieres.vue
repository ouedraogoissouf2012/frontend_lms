<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <BookOpenIcon class="widget-icon text-orange-600" />
      <h2 class="widget-title">Matières KLASSCI</h2>
      <span v-if="loading" class="loading-indicator">Chargement...</span>
    </div>

    <div v-if="matieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="matiere in matieres"
        :key="matiere.id"
        class="matiere-card"
      >
        <div class="matiere-header">
          <BookOpenIcon class="matiere-icon text-orange-600" />
          <h3 class="matiere-name">{{ matiere.nom }}</h3>
        </div>
        <p v-if="matiere.code" class="matiere-code">Code: {{ matiere.code }}</p>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state-inline">
      <BookOpenIcon class="empty-icon" />
      <p class="empty-message">Aucune matière disponible</p>
    </div>
  </div>
</template>

<script setup>
/** Widget Matières KLASSCI d'AdminDashboard (#H3 ≤300). Présentation pure. */
import { BookOpenIcon } from '@heroicons/vue/24/outline'

defineProps({
  matieres: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
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

.loading-indicator {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Matiere card */
.matiere-card {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.matiere-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.matiere-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.matiere-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.matiere-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.matiere-code {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Empty state inline */
.empty-state-inline {
  padding: 3rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
}

.empty-message {
  color: var(--text-secondary);
}
</style>
