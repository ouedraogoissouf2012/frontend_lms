<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <BookOpenIcon class="widget-icon text-blue-600" />
      <h2 class="widget-title">Mes Matières</h2>
    </div>
    <div v-if="matieres && matieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="matiere in matieres"
        :key="matiere.id || matiere.matiere_id"
        class="course-card"
        @click="$emit('navigate', matiere)"
        @keydown.enter="$emit('navigate', matiere)"
        @keydown.space.prevent="$emit('navigate', matiere)"
        role="button"
        tabindex="0"
      >
        <h3 class="course-title">
          {{ matiere.name || matiere.nom || matiere.libelle || 'Matière sans nom' }}
        </h3>
        <p v-if="matiere.coefficient" class="course-info">
          Coefficient: {{ matiere.coefficient }}
        </p>

        <button
          @click.stop="$emit('navigate', matiere)"
          class="course-btn"
        >
          <BookOpenIcon class="w-5 h-5" />
          Gérer la matière
        </button>
      </div>
    </div>
    <div v-else class="empty-state-inline">
      <p class="empty-message">Aucune matière assignée</p>
    </div>
  </div>
</template>

<script setup>
/** Widget « Mes Matières » du dashboard enseignant (#H11 ≤300).
 *  Présentation pure : liste des matières, émet `navigate` au clic/clavier. */
import { BookOpenIcon } from '@heroicons/vue/24/outline'

defineProps({
  matieres: { type: Array, default: () => [] }
})
defineEmits(['navigate'])
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

.course-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.course-btn:hover {
  background: var(--color-primary-dark);
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
