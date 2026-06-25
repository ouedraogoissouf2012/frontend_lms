/**
 * Tests unitaires de useGlobalSearch (logique extraite de GlobalSearchModal, #G1).
 * vue-router et searchService sont mockés. On vérifie le regroupement des
 * résultats, le highlight + la navigation clavier, la sélection (historique +
 * émission + router.push + fermeture) et la réinitialisation à la fermeture.
 */
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { push, globalSearch, getSearchHistory, saveToHistory } = vi.hoisted(() => ({
  push: vi.fn(),
  globalSearch: vi.fn(),
  getSearchHistory: vi.fn(() => Promise.resolve([])),
  saveToHistory: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/services/search', () => ({
  searchService: { globalSearch, getSearchHistory, saveToHistory },
}))

import { useGlobalSearch } from '@/composables/useGlobalSearch'

// Monte le composable dans un faux composant pour avoir un scope d'effets.
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

function setup(onResultSelected = vi.fn()) {
  const isOpen = ref(true)
  let api
  const Comp = defineComponent({
    setup() {
      api = useGlobalSearch({ isOpen, onResultSelected })
      return () => h('div')
    },
  })
  const wrapper = mount(Comp)
  return { api, isOpen, wrapper, onResultSelected }
}

beforeEach(() => {
  push.mockClear()
  globalSearch.mockReset()
  saveToHistory.mockClear()
})

describe('useGlobalSearch', () => {
  it('handleInput sous 2 caractères vide les résultats sans appeler le service', () => {
    const { api } = setup()
    api.query.value = 'a'
    api.handleInput()
    expect(api.hasResults.value).toBe(false)
    expect(globalSearch).not.toHaveBeenCalled()
  })

  it('performSearch regroupe les résultats, calcule total/has et fixe le highlight initial', async () => {
    globalSearch.mockResolvedValue({
      results: { users: [{ id: 1 }], lessons: [], evaluations: [{ id: 2 }, { id: 3 }], classes: [], matieres: [] },
    })
    const { api } = setup()
    api.query.value = 'math'
    await api.performSearch()

    expect(api.hasResults.value).toBe(true)
    expect(api.totalResults.value).toBe(3)
    expect(Object.keys(api.filteredResults.value)).toEqual(['users', 'evaluations'])
    expect(api.highlightedCategory.value).toBe('users')
    expect(api.highlightedIndex.value).toBe(0)
    expect(api.isHighlighted('users', 0)).toBe(true)
  })

  it('navigateDown traverse les items puis passe à la catégorie suivante', async () => {
    globalSearch.mockResolvedValue({
      results: { users: [{ id: 1 }], lessons: [{ id: 9 }, { id: 10 }], evaluations: [], classes: [], matieres: [] },
    })
    const { api } = setup()
    await api.performSearch()
    // highlight initial: users[0]
    api.navigateDown() // -> lessons[0]
    expect(api.highlightedCategory.value).toBe('lessons')
    expect(api.highlightedIndex.value).toBe(0)
    api.navigateDown() // -> lessons[1]
    expect(api.highlightedIndex.value).toBe(1)
    api.navigateDown() // borne basse : reste lessons[1]
    expect(api.highlightedIndex.value).toBe(1)
    api.navigateUp() // -> lessons[0]
    expect(api.highlightedIndex.value).toBe(0)
    api.navigateUp() // -> users[0]
    expect(api.highlightedCategory.value).toBe('users')
  })

  it('selectResult sauvegarde l\'historique, émet, navigue puis ferme', async () => {
    const onResultSelected = vi.fn()
    const { api, isOpen } = setup(onResultSelected)
    api.query.value = 'eleve'
    const item = { id: 5, url: '/users/5' }
    api.selectResult(item)

    expect(saveToHistory).toHaveBeenCalledWith('eleve')
    expect(onResultSelected).toHaveBeenCalledWith(item)
    expect(push).toHaveBeenCalledWith('/users/5')
    expect(isOpen.value).toBe(false)
    expect(api.query.value).toBe('') // close() réinitialise
  })

  it('selectResult sans url ne navigue pas', () => {
    const { api } = setup()
    api.selectResult({ id: 7 })
    expect(push).not.toHaveBeenCalled()
  })

  it('getCategoryTitle et getIcon ont des valeurs par défaut', () => {
    const { api } = setup()
    expect(api.getCategoryTitle('users')).toBe('Utilisateurs')
    expect(api.getCategoryTitle('inconnu')).toBe('inconnu')
    expect(api.getIcon('UserIcon')).toBeTruthy()
    expect(api.getIcon('IconeInexistante')).toBeTruthy()
  })
})
