/**
 * Test de MONTAGE de MobileHeader.vue (G9 — fichier déjà < 300, vérif parité).
 *
 * Le header n'est rendu qu'en mobile (window.innerWidth < 768) : on force la
 * largeur avant montage. Vérifie le rendu, les initiales utilisateur et l'emit
 * `toggle-sidebar` au clic sur le hamburger.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  auth: {
    getUser: () => ({ role: 'enseignant', name: 'Jane Doe' }),
    logout: vi.fn().mockResolvedValue()
  }
}))

const pushMock = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push: pushMock }) }))

import MobileHeader from '@/components/layout/MobileHeader.vue'

function mountHeader() {
  return mount(MobileHeader, {
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }
    }
  })
}

describe('MobileHeader.vue (G9) — montage', () => {
  beforeEach(() => {
    window.innerWidth = 500 // mobile
    pushMock.mockReset()
  })

  it('monte en mobile et affiche les initiales', () => {
    const w = mountHeader()
    expect(w.find('.mobile-header').exists()).toBe(true)
    expect(w.find('.user-avatar').text()).toBe('JD')
  })

  it('émet toggle-sidebar au clic sur le hamburger', async () => {
    const w = mountHeader()
    await w.find('.hamburger-btn').trigger('click')
    expect(w.emitted('toggle-sidebar')).toBeTruthy()
  })
})
