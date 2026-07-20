<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <BookOpenIcon class="widget-icon text-orange-600" />
      <h2 class="widget-title">Matières KLASSCI</h2>
      <span v-if="matieres.length > 0" class="widget-count">
        {{ displayedMatieres.length }}/{{ matieres.length }}
      </span>
      <router-link v-if="viewAllTo" :to="viewAllTo" class="view-all-link">
        Voir tout
      </router-link>
      <span v-if="loading" class="loading-indicator">Chargement...</span>
    </div>

    <div v-if="displayedMatieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="matiere in displayedMatieres"
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

    <div v-if="hiddenCount > 0" class="preview-footer">
      <span>{{ hiddenCount }} autre{{ hiddenCount > 1 ? 's' : '' }} matière{{ hiddenCount > 1 ? 's' : '' }} disponible{{ hiddenCount > 1 ? 's' : '' }}</span>
      <router-link v-if="viewAllTo" :to="viewAllTo" class="preview-link">
        Ouvrir la liste complète
      </router-link>
    </div>

    <div v-if="displayedMatieres.length === 0 && !loading" class="empty-state-inline">
      <BookOpenIcon class="empty-icon" />
      <p class="empty-message">Aucune matière disponible</p>
    </div>
  </div>
</template>

<script setup>
/** Widget Matières KLASSCI d'AdminDashboard (#H3 ≤300). Présentation pure. */
import { computed } from 'vue'
import { BookOpenIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  matieres: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  limit: { type: Number, default: 12 },
  viewAllTo: { type: String, default: '/admin/matieres' },
})

const displayedMatieres = computed(() => {
  if (!props.limit || props.limit < 1) return props.matieres
  return props.matieres.slice(0, props.limit)
})

const hiddenCount = computed(() => Math.max(props.matieres.length - displayedMatieres.value.length, 0))
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
  min-width: 0;
}

.loading-indicator {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.widget-count {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.view-all-link,
.preview-link {
  font-size: 0.875rem;
  color: var(--blue-500);
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
}

.view-all-link:hover,
.preview-link:hover {
  color: var(--color-info-strong);
  text-decoration: underline;
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
  overflow-wrap: anywhere;
}

.matiere-code {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.875rem;
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

@media (max-width: 640px) {
  .widget-header,
  .preview-footer {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
