import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { searchService } from '@/services/search'
import {
  UserIcon,
  BookOpenIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  AcademicCapIcon
} from '@heroicons/vue/24/outline'

const EMPTY_RESULTS = () => ({
  users: [],
  lessons: [],
  evaluations: [],
  classes: [],
  matieres: []
})

const CATEGORY_TITLES = {
  users: 'Utilisateurs',
  lessons: 'Cours',
  evaluations: 'Évaluations',
  classes: 'Classes',
  matieres: 'Matières'
}

const CATEGORY_ICONS = {
  UserIcon,
  BookOpenIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  AcademicCapIcon
}

/**
 * Couche logique de GlobalSearchModal (#G1 ≤300) : état (query, résultats,
 * historique, highlight), debounce + appel searchService, regroupement des
 * résultats, navigation clavier (↑/↓/Enter/Esc), sélection + navigation router,
 * raccourci global Cmd/Ctrl+K et focus à l'ouverture. La modale ne fait que câbler.
 *
 * @param {object} opts
 * @param {import('vue').WritableComputedRef<boolean>} opts.isOpen v-model d'ouverture.
 * @param {(item: object) => void} opts.onResultSelected émis lors d'une sélection.
 */
export function useGlobalSearch({ isOpen, onResultSelected }) {
  const router = useRouter()

  const searchInput = ref(null)
  const query = ref('')
  const searching = ref(false)
  const results = ref(EMPTY_RESULTS())
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
    return CATEGORY_TITLES[category] || category
  }

  function getIcon(iconName) {
    return CATEGORY_ICONS[iconName] || UserIcon
  }

  function handleInput() {
    if (query.value.length < 2) {
      results.value = EMPTY_RESULTS()
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
    onResultSelected?.(item)

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
    results.value = EMPTY_RESULTS()
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

  return {
    searchInput, query, searching, results, searchHistory,
    highlightedCategory, highlightedIndex,
    filteredResults, hasResults, totalResults,
    getCategoryTitle, getIcon, handleInput, performSearch,
    isHighlighted, setHighlight, navigateDown, navigateUp,
    selectHighlighted, selectResult, loadHistory, close,
  }
}
