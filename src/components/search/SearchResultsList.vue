<template>
  <div class="search-results">
    <!-- Chaque catégorie -->
    <div
      v-for="(items, category) in filteredResults"
      :key="category"
      v-show="items.length > 0"
      class="results-category"
    >
      <div class="category-header">
        <span class="category-title">{{ getCategoryTitle(category) }}</span>
        <span class="category-count">{{ items.length }}</span>
      </div>

      <div class="category-items">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="result-item"
          :class="{ highlighted: isHighlighted(category, index) }"
          @click="$emit('select', item)"
          @mouseenter="$emit('highlight', category, index)"
        >
          <div class="result-icon" :class="`icon-${item.type}`">
            <component :is="getIcon(item.icon)" class="w-5 h-5" />
          </div>
          <div class="result-content">
            <p class="result-title">{{ item.title }}</p>
            <p class="result-subtitle">{{ item.subtitle }}</p>
            <p v-if="item.description" class="result-description">
              {{ item.description }}
            </p>
          </div>
          <ChevronRightIcon class="result-arrow" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Sections de résultats de GlobalSearchModal (#G1 ≤300). Présentationnel : reçoit
 * les résultats regroupés + les helpers de titre/icône/highlight, émet select et
 * highlight. Aucune logique métier (debounce/recherche restent dans le composable).
 */
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

defineProps({
  filteredResults: { type: Object, default: () => ({}) },
  getCategoryTitle: { type: Function, required: true },
  getIcon: { type: Function, required: true },
  isHighlighted: { type: Function, required: true },
})

defineEmits(['select', 'highlight'])
</script>

<style scoped>
/* Results */
.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.results-category {
  margin-bottom: 1rem;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
}

.category-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.category-count {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
}

.result-item:hover,
.result-item.highlighted {
  background: var(--bg-secondary);
}

.result-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

.icon-user {
  background: var(--info-bg);
  color: var(--info-text);
}

.icon-lesson {
  background: var(--emerald-100);
  color: var(--emerald-800);
}

.icon-evaluation {
  background: var(--warning-bg);
  color: var(--amber-800);
}

.icon-classe {
  background: var(--purple-100);
  color: var(--purple-800);
}

.icon-matiere {
  background: var(--error-bg);
  color: var(--error-text);
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.125rem 0;
}

.result-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.result-description {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0.25rem 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-tertiary);
  flex-shrink: 0;
}
</style>
