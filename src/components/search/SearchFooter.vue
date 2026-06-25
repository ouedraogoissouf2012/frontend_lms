<template>
  <div class="search-footer">
    <div class="footer-shortcuts">
      <div class="shortcut">
        <kbd>↑</kbd><kbd>↓</kbd>
        <span>Naviguer</span>
      </div>
      <div class="shortcut">
        <kbd>Enter</kbd>
        <span>Sélectionner</span>
      </div>
      <div class="shortcut">
        <kbd>ESC</kbd>
        <span>Fermer</span>
      </div>
    </div>
    <div v-if="totalResults > 0" class="footer-stats">
      {{ totalResults }} résultat{{ totalResults > 1 ? 's' : '' }}
    </div>
  </div>
</template>

<script setup>
/**
 * Pied de GlobalSearchModal (#G1 ≤300) : rappel des raccourcis clavier et compteur
 * de résultats. Purement présentationnel, une seule prop (totalResults).
 */
defineProps({
  totalResults: { type: Number, default: 0 },
})
</script>

<style scoped>
/* Footer */
.search-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.footer-shortcuts {
  display: flex;
  gap: 1rem;
}

.shortcut {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.shortcut kbd {
  padding: 0.25rem 0.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-secondary);
}

.shortcut span {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.footer-stats {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .footer-shortcuts {
    display: none;
  }
}
</style>
