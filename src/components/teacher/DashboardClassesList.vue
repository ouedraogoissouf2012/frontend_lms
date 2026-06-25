<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <UserGroupIcon class="widget-icon text-green-600" />
      <h2 class="widget-title">Mes Classes</h2>
    </div>
    <div v-if="classes && classes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="classe in classes"
        :key="classe.id"
        class="course-card"
      >
        <h3 class="course-title">{{ classe.name || classe.libelle }}</h3>
        <p v-if="classe.filiere" class="course-info mb-1">
          Filière: {{ classe.filiere.name || classe.filiere.nom }}
        </p>
        <p v-if="classe.niveau" class="course-info">
          Niveau: {{ classe.niveau.name || classe.niveau.nom }}
        </p>
      </div>
    </div>
    <div v-else class="empty-state-inline">
      <p class="empty-message">Aucune classe assignée</p>
    </div>
  </div>
</template>

<script setup>
/** Widget « Mes Classes » du dashboard enseignant (#H11 ≤300).
 *  Présentation pure : liste des classes (filière/niveau). */
import { UserGroupIcon } from '@heroicons/vue/24/outline'

defineProps({
  classes: { type: Array, default: () => [] }
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
}

/* Course card */
.course-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-card:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.course-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Empty state inline */
.empty-state-inline {
  padding: 2rem;
  text-align: center;
}

.empty-message {
  color: var(--text-secondary);
}
</style>
