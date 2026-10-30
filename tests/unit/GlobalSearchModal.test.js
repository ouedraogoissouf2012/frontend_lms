/**
 * Test de montage de GlobalSearchModal (G6).
 * Le contenu est rendu via <Teleport to="body"> et conditionné par modelValue.
 * Router et service de recherche sont mockés. On vérifie le montage fermé puis
 * l'apparition du modal dans le body quand modelValue passe à true.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/search', () => ({
  searchService: {
    globalSearch: vi.fn(() => Promise.resolve({ results: {} })),
    getSearchHistory: vi.fn(() => Promise.resolve([])),
    saveToHistory: vi.fn()
  }
}))

import GlobalSearchModal from '@/components/modals/GlobalSearchModal.vue'

afterEach(() => { document.body.innerHTML = '' })

describe('GlobalSearchModal (G6) — montage', () => {
  it('monte fermé sans erreur (rien dans le body)', () => {
    const w = mount(GlobalSearchModal, { props: { modelValue: false } })
    expect(w.exists()).toBe(true)
    expect(document.body.querySelector('.search-modal')).toBeNull()
  })

  it('ouvert (modelValue=true) : le modal et son champ de recherche sont téléportés dans le body', async () => {
    mount(GlobalSearchModal, { props: { modelValue: true }, attachTo: document.body })
    await flushPromises()
    expect(document.body.querySelector('.search-modal')).not.toBeNull()
    expect(document.body.querySelector('.search-input')).not.toBeNull()
  })

  it('ouvert : la région qui annonce un échec existe déjà, vide, en role="status"', async () => {
    mount(GlobalSearchModal, { props: { modelValue: true }, attachTo: document.body })
    await flushPromises()
    const region = document.body.querySelector('[data-test="erreur-recherche"]')
    expect(region).not.toBeNull()
    expect(region.getAttribute('role')).toBe('status')
    expect(region.textContent.trim()).toBe('')
    expect(region.getAttribute('style')).toBeNull()
  })
})
