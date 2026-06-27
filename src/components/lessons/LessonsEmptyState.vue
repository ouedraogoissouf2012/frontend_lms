<template>
  <div class="empty-state">
    <div class="empty-icon-wrapper">
      <BookOpenIcon class="empty-icon" />
    </div>
    <h3 class="empty-title">Aucune leçon trouvée</h3>
    <p class="empty-description">
      {{ hasFilters
        ? 'Aucune leçon ne correspond à vos filtres.'
        : 'Vous n\'avez pas encore créé de leçon.' }}
    </p>
  </div>
</template>

<script setup>
/**
 * État vide de la liste des leçons enseignant (#H4 ≤300). Le message dépend de
 * `hasFilters` (filtres actifs vs aucune leçon créée). Présentationnel.
 */
import { BookOpenIcon } from '@heroicons/vue/24/outline'

defineProps({
  hasFilters: { type: Boolean, default: false }
})
</script>

<style scoped>
/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn-create-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-empty:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}
</style>
