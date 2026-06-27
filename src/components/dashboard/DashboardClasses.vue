<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <BuildingLibraryIcon class="widget-icon text-purple-600" />
      <h2 class="widget-title">Classes KLASSCI</h2>
      <span v-if="loading" class="loading-indicator">Chargement...</span>
    </div>

    <div v-if="classes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="classe in classes"
        :key="classe.id"
        class="class-card"
      >
        <div class="class-header">
          <h3 class="class-name">{{ classe.name }}</h3>
          <span class="class-niveau">
            {{ classe.niveau?.name || 'N/A' }}
          </span>
        </div>
        <div v-if="classe.filiere" class="class-filiere">
          <span class="filiere-name">{{ classe.filiere.name }}</span> - {{ classe.filiere.code }}
        </div>
        <div class="class-footer">
          <div class="class-capacity">
            <AcademicCapIcon class="w-4 h-4" />
            <span>{{ classe.places_occupees || 0 }}/{{ classe.places_totales || 0 }}</span>
          </div>
          <span v-if="classe.is_active" class="active-badge">
            Active
          </span>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state-inline">
      <BuildingLibraryIcon class="empty-icon" />
      <p class="empty-message">Aucune classe disponible</p>
    </div>
  </div>
</template>

<script setup>
/** Widget Classes KLASSCI d'AdminDashboard (#H3 ≤300). Présentation pure. */
import {
  AcademicCapIcon,
  BuildingLibraryIcon
} from '@heroicons/vue/24/outline'

defineProps({
  classes: { type: Array, default: () => [] },
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

/* Class card */
.class-card {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.class-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.class-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.class-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.class-niveau {
  padding: 0.25rem 0.5rem;
  background: var(--indigo-100);
  color: var(--violet-800);
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.class-filiere {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.filiere-name {
  font-weight: 600;
}

.class-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.class-capacity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.active-badge {
  padding: 0.25rem 0.5rem;
  background: var(--success-bg);
  color: var(--success-text);
  border-radius: 0.25rem;
  font-size: 0.75rem;
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
