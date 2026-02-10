<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="search-modal-overlay" @click="close">
        <div class="search-modal" @click.stop>
          <!-- Search Input -->
          <div class="search-header">
            <MagnifyingGlassIcon class="search-icon" />
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              class="search-input"
              placeholder="Rechercher des utilisateurs, cours, évaluations..."
              @input="handleInput"
              @keydown.down.prevent="navigateDown"
              @keydown.up.prevent="navigateUp"
              @keydown.enter="selectHighlighted"
              @keydown.esc="close"
            />
            <kbd class="shortcut-badge">ESC</kbd>
          </div>

          <!-- Loading -->
          <ContentLoader v-if="searching" text="Recherche en cours..." />

          <!-- Results -->
          <div v-else-if="hasResults" class="search-results">
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
                  @click="selectResult(item)"
                  @mouseenter="setHighlight(category, index)"
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

          <!-- No Results -->
          <div v-else-if="query.length >= 2 && !searching" class="empty-state">
            <MagnifyingGlassIcon class="empty-icon" />
            <p class="empty-message">Aucun résultat pour "{{ query }}"</p>
            <p class="empty-subtitle">Essayez avec d'autres mots-clés</p>
          </div>

          <!-- History / Welcome -->
          <div v-else-if="!query && searchHistory.length > 0" class="search-history">
            <div class="history-header">
              <ClockIcon class="history-icon" />
              <span class="history-title">Recherches récentes</span>
            </div>
            <div class="history-items">
              <div
                v-for="(item, index) in searchHistory"
                :key="index"
                class="history-item"
                @click="query = item.query"
              >
                <ClockIcon class="w-4 h-4 text-gray-400" />
                <span class="history-query">{{ item.query }}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { searchService } from '@/services/search'
import {
  MagnifyingGlassIcon,
  ClockIcon,
  ChevronRightIcon,
  UserIcon,
  BookOpenIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  AcademicCapIcon
} from '@heroicons/vue/24/outline'
import ContentLoader from '@/components/common/ContentLoader.vue'

const router = useRouter()

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

const searchInput = ref(null)
const query = ref('')
const searching = ref(false)
const results = ref({
  users: [],
  lessons: [],
  evaluations: [],
  classes: [],
  matieres: []
})
const searchHistory = ref([])
const highlightedCategory = ref(null)
const highlightedIndex = ref(-1)
let searchTimeout = null

const filteredResults = computed(() => {
  return Object.fromEntries(
    Object.entries(results.value).filter(([_, items]) => items.length > 0)
  )
})

const hasResults = computed(() => {
  return Object.values(results.value).some(items => items.length > 0)
})

const totalResults = computed(() => {
  return Object.values(results.value).reduce((sum, items) => sum + items.length, 0)
})

function getCategoryTitle(category) {
  const titles = {
    users: 'Utilisateurs',
    lessons: 'Cours',
    evaluations: 'Évaluations',
    classes: 'Classes',
    matieres: 'Matières'
  }
  return titles[category] || category
}

function getIcon(iconName) {
  const icons = {
    UserIcon,
    BookOpenIcon,
    DocumentTextIcon,
    BuildingLibraryIcon,
    AcademicCapIcon
  }
  return icons[iconName] || UserIcon
}

function handleInput() {
  if (query.value.length < 2) {
    results.value = {
      users: [],
      lessons: [],
      evaluations: [],
      classes: [],
      matieres: []
    }
    return
  }

  // Debounce la recherche
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    await performSearch()
  }, 300)
}

async function performSearch() {
  searching.value = true
  try {
    const response = await searchService.globalSearch(query.value)

    if (response) {
      results.value = response.results
      console.log('Résultats recherche:', response)

      // Réinitialiser highlight
      const firstCategory = Object.keys(filteredResults.value)[0]
      if (firstCategory) {
        highlightedCategory.value = firstCategory
        highlightedIndex.value = 0
      }
    }
  } catch (error) {
    console.error('Erreur recherche:', error)
  } finally {
    searching.value = false
  }
}

function isHighlighted(category, index) {
  return highlightedCategory.value === category && highlightedIndex.value === index
}

function setHighlight(category, index) {
  highlightedCategory.value = category
  highlightedIndex.value = index
}

function navigateDown() {
  const categories = Object.keys(filteredResults.value)
  if (categories.length === 0) return

  const currentCategory = highlightedCategory.value || categories[0]
  const currentCategoryIndex = categories.indexOf(currentCategory)
  const currentCategoryItems = filteredResults.value[currentCategory]

  if (highlightedIndex.value < currentCategoryItems.length - 1) {
    highlightedIndex.value++
  } else if (currentCategoryIndex < categories.length - 1) {
    // Passer à la catégorie suivante
    highlightedCategory.value = categories[currentCategoryIndex + 1]
    highlightedIndex.value = 0
  }
}

function navigateUp() {
  const categories = Object.keys(filteredResults.value)
  if (categories.length === 0) return

  const currentCategory = highlightedCategory.value || categories[0]
  const currentCategoryIndex = categories.indexOf(currentCategory)

  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  } else if (currentCategoryIndex > 0) {
    // Passer à la catégorie précédente
    const prevCategory = categories[currentCategoryIndex - 1]
    highlightedCategory.value = prevCategory
    highlightedIndex.value = filteredResults.value[prevCategory].length - 1
  }
}

function selectHighlighted() {
  if (highlightedCategory.value && highlightedIndex.value >= 0) {
    const item = filteredResults.value[highlightedCategory.value][highlightedIndex.value]
    selectResult(item)
  }
}

function selectResult(item) {
  console.log('Sélectionné:', item)

  // Sauvegarder dans l'historique
  searchService.saveToHistory(query.value)

  // Émettre l'événement
  emit('result-selected', item)

  // Naviguer vers l'URL
  if (item.url) {
    router.push(item.url)
  }

  // Fermer le modal
  close()
}

async function loadHistory() {
  searchHistory.value = await searchService.getSearchHistory()
}

function close() {
  isOpen.value = false
  query.value = ''
  results.value = {
    users: [],
    lessons: [],
    evaluations: [],
    classes: [],
    matieres: []
  }
  highlightedCategory.value = null
  highlightedIndex.value = -1
}

function handleKeydown(event) {
  // Cmd+K (Mac) ou Ctrl+K (Windows/Linux)
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    isOpen.value = !isOpen.value
  }
}

watch(isOpen, async (newValue) => {
  if (newValue) {
    await loadHistory()
    await nextTick()
    searchInput.value?.focus()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearTimeout(searchTimeout)
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

/* Search Header */
.search-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.search-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 1rem;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.shortcut-badge {
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-secondary);
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
  background: #dbeafe;
  color: #1e40af;
}

.icon-lesson {
  background: #d1fae5;
  color: #065f46;
}

.icon-evaluation {
  background: #fef3c7;
  color: #92400e;
}

.icon-classe {
  background: #f3e8ff;
  color: #6b21a8;
}

.icon-matiere {
  background: #fee2e2;
  color: #991b1b;
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

  .footer-shortcuts {
    display: none;
  }
}
</style>
