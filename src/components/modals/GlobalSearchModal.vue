<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="search-modal-overlay" @click="close">
        <div class="search-modal" @click.stop>
          <!-- Search Input -->
          <SearchHeader
            ref="searchInput"
            v-model:query="query"
            @input="handleInput"
            @navigate-down="navigateDown"
            @navigate-up="navigateUp"
            @select-highlighted="selectHighlighted"
            @close="close"
          />

          <!-- Loading -->
          <ContentLoader v-if="searching" text="Recherche en cours..." />

          <!-- Results -->
          <SearchResultsList
            v-else-if="hasResults"
            :filtered-results="filteredResults"
            :get-category-title="getCategoryTitle"
            :get-icon="getIcon"
            :is-highlighted="isHighlighted"
            @select="selectResult"
            @highlight="setHighlight"
          />

          <!-- No Results / History -->
          <SearchEmptyState
            v-else
            :query="query"
            :search-history="searchHistory"
            :show-empty="query.length >= 2 && !searching"
            :show-history="!query && searchHistory.length > 0"
            @select-history="(q) => (query = q)"
          />

          <!-- Footer -->
          <SearchFooter :total-results="totalResults" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * Modale de recherche globale (Cmd/Ctrl+K). Orchestrateur (#G1 ≤300) : toute la
 * logique vit dans useGlobalSearch ; l'UI est composée de SearchHeader,
 * SearchResultsList, SearchEmptyState et SearchFooter. API publique inchangée :
 * v-model (modelValue) + @result-selected.
 */
import { computed } from 'vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import SearchHeader from '@/components/search/SearchHeader.vue'
import SearchResultsList from '@/components/search/SearchResultsList.vue'
import SearchEmptyState from '@/components/search/SearchEmptyState.vue'
import SearchFooter from '@/components/search/SearchFooter.vue'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'result-selected'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const {
  searchInput, query, searching, searchHistory,
  filteredResults, hasResults, totalResults,
  getCategoryTitle, getIcon, handleInput,
  isHighlighted, setHighlight, navigateDown, navigateUp,
  selectHighlighted, selectResult, close,
} = useGlobalSearch({
  isOpen,
  onResultSelected: (item) => emit('result-selected', item),
})
</script>

<style scoped>
.search-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 5rem 1rem 1rem;
  z-index: 10000;
  overflow-y: auto;
}

.search-modal {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 10rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Loading */
.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .search-modal,
.modal-fade-leave-active .search-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from .search-modal,
.modal-fade-leave-to .search-modal {
  transform: scale(0.95);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .search-modal-overlay {
    padding: 1rem;
  }

  .search-modal {
    max-height: calc(100vh - 2rem);
  }
}
</style>
