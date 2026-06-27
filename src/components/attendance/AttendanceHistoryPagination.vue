<template>
  <div v-if="pagination.last_page > 1" class="pagination">
    <button
      @click="$emit('load-page', pagination.current_page - 1)"
      :disabled="pagination.current_page === 1"
      class="btn-page"
    >
      ← Précédent
    </button>

    <span class="page-info">
      Page {{ pagination.current_page }} / {{ pagination.last_page }}
      ({{ pagination.total }} résultats)
    </span>

    <button
      @click="$emit('load-page', pagination.current_page + 1)"
      :disabled="pagination.current_page === pagination.last_page"
      class="btn-page"
    >
      Suivant →
    </button>
  </div>
</template>

<script setup>
/**
 * Pagination « Précédent / Suivant » de l'historique des présences (H7) —
 * sous-composant présentationnel extrait d'AttendanceHistory.vue. Émet load-page
 * avec le numéro de page cible ; ne rend rien sur une seule page (parité).
 */
defineProps({
  pagination: { type: Object, required: true }
})

defineEmits(['load-page'])
</script>

<style scoped>
/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-page {
  padding: 0.625rem 1rem;
  background: var(--blue-500);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: #2563eb;
}

.btn-page:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
