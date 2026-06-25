<template>
  <!-- No Results -->
  <div v-if="showEmpty" class="empty-state">
    <MagnifyingGlassIcon class="empty-icon" />
    <p class="empty-message">Aucun résultat pour "{{ query }}"</p>
    <p class="empty-subtitle">Essayez avec d'autres mots-clés</p>
  </div>

  <!-- History / Welcome -->
  <div v-else-if="showHistory" class="search-history">
    <div class="history-header">
      <ClockIcon class="history-icon" />
      <span class="history-title">Recherches récentes</span>
    </div>
    <div class="history-items">
      <div
        v-for="(item, index) in searchHistory"
        :key="index"
        class="history-item"
        @click="$emit('select-history', item.query)"
      >
        <ClockIcon class="w-4 h-4 text-gray-400" />
        <span class="history-query">{{ item.query }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * États « aucun résultat » et « recherches récentes » de GlobalSearchModal
 * (#G1 ≤300). Présentationnel : reçoit query/searchHistory + les drapeaux de
 * visibilité (calculés côté composable), émet select-history(query) au clic.
 */
import { MagnifyingGlassIcon, ClockIcon } from '@heroicons/vue/24/outline'

defineProps({
  query: { type: String, default: '' },
  searchHistory: { type: Array, default: () => [] },
  showEmpty: { type: Boolean, default: false },
  showHistory: { type: Boolean, default: false },
})

defineEmits(['select-history'])
</script>

<style scoped>
/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-tertiary);
  margin-bottom: 1rem;
}

.empty-message {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.empty-subtitle {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin: 0;
}

/* Search History */
.search-history {
  padding: 1rem;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.history-icon {
  width: 1rem;
  height: 1rem;
  color: var(--text-secondary);
}

.history-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
}

.history-item:hover {
  background: var(--bg-tertiary);
}

.history-query {
  font-size: 0.875rem;
  color: var(--text-primary);
}
</style>
