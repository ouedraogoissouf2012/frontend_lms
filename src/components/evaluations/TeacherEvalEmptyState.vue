<template>
  <div class="empty-state">
    <DocumentTextIcon class="empty-icon" />
    <h3 class="empty-title">Aucune évaluation trouvée</h3>
    <p class="empty-message">
      {{ hasFilters
        ? 'Aucune évaluation ne correspond à vos filtres'
        : 'Vos évaluations apparaîtront ici' }}
    </p>
    <button
      v-if="hasFilters"
      @click="$emit('reset')"
      class="btn-empty"
    >
      Réinitialiser les filtres
    </button>
  </div>
</template>

<script setup>
/**
 * État vide de TeacherEvaluations (H1) : message adapté selon la présence de
 * filtres et bouton de réinitialisation. Présentation pure ; CSS déplacé verbatim
 * depuis TeacherEvaluations.
 */
import { DocumentTextIcon } from '@heroicons/vue/24/outline'

defineProps({
  hasFilters: { type: Boolean, default: false }
})

defineEmits(['reset'])
</script>

<style scoped>
/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.empty-icon {
  width: 6rem;
  height: 6rem;
  color: var(--text-tertiary);
  margin: 0 auto 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.btn-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-empty:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}
</style>
