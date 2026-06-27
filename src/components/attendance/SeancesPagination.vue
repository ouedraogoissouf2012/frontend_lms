<template>
  <div v-if="pagination.last_page > 1" class="pagination-wrapper">
    <button
      @click="$emit('change-page', pagination.current_page - 1)"
      :disabled="pagination.current_page === 1"
      class="pagination-btn"
    >
      ← Précédent
    </button>

    <span class="pagination-info">
      Page {{ pagination.current_page }} / {{ pagination.last_page }}
    </span>

    <button
      @click="$emit('change-page', pagination.current_page + 1)"
      :disabled="pagination.current_page === pagination.last_page"
      class="pagination-btn"
    >
      Suivant →
    </button>
  </div>
</template>

<script setup>
/**
 * Pagination « Précédent / Suivant » de l'historique des séances (H7) —
 * sous-composant présentationnel extrait de SeanceAttendanceHistory.vue. Émet
 * change-page avec la page cible ; ne rend rien sur une seule page (parité).
 */
defineProps({
  pagination: { type: Object, required: true }
})

defineEmits(['change-page'])
</script>

<style scoped>
/* Pagination */
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.pagination-btn {
  padding: 0.625rem 1.25rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--blue-500) 0%, #2563eb 100%);
  color: white;
  border-color: var(--blue-500);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0 0.5rem;
}
</style>
