/**
 * Test de MONTAGE de Navbar.vue (G9 — fichier déjà < 300, vérif de parité).
 *
 * Confirme que la navbar monte sans erreur, affiche le titre de page issu de
 * route.meta.title et les initiales utilisateur. Le composable useNotifications
 * et le router sont mockés (aucune requête réelle).
 */
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  auth: {
    getUser: () => ({ role: 'enseignant', nom: 'Doe', prenom: 'Jane' }),
    logout: vi.fn().mockResolvedValue()
  }
}))

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/teacher/dashboard', meta: { title: 'Tableau de bord' } }),
  useRouter: () => ({ push: pushMock })
}))

const loadNotifications = vi.fn()
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    notifications: ref([]),
    unreadCount: ref(0),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    loadNotifications
  })
}))

import Navbar from '@/components/layout/Navbar.vue'

function mountNavbar() {
  return mount(Navbar, {
    global: {
      stubs: {
        ThemeToggle: { template: '<button class="theme-toggle" />' },
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }
      }
    }
  })
}

describe('Navbar.vue (G9) — montage', () => {
  beforeEach(() => {
    pushMock.mockReset()
    loadNotifications.mockReset()
  })

  it('monte et affiche le titre de page (route.meta.title)', () => {
    const w = mountNavbar()
    expect(w.find('.modern-navbar').exists()).toBe(true)
    expect(w.find('.page-title').text()).toBe('Tableau de bord')
  })

  it('affiche les initiales de l\'utilisateur', () => {
    const w = mountNavbar()
    expect(w.find('.user-avatar').text()).toBe('JD')
  })
})
