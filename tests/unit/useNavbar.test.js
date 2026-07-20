/**
 * Tests de la logique useNavbar (#H12) — services/router/useNotifications mockés.
 * On exécute le composable dans un composant hôte (il dépend de useRoute/onMounted),
 * et on vérifie : titre de page, fil d'Ariane, initiales, URLs selon le rôle,
 * bascule exclusive des menus et déconnexion.
 */
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const logout = vi.fn()
vi.mock('@/services/api', () => ({
  auth: { getUser: () => getUser(), logout: () => logout() }
}))

const pushMock = vi.fn()
let currentRoute = { path: '/teacher/dashboard', meta: { title: 'Tableau de bord' } }
vi.mock('vue-router', () => ({
  useRoute: () => currentRoute,
  useRouter: () => ({ push: pushMock })
}))

const loadNotifications = vi.fn()
const markAllAsReadSvc = vi.fn().mockResolvedValue()
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    notifications: ref([]),
    unreadCount: ref(3),
    markAsRead: vi.fn(),
    markAllAsRead: markAllAsReadSvc,
    loadNotifications
  })
}))

import { useNavbar } from '@/composables/useNavbar'

function run(routeOverride) {
  if (routeOverride) currentRoute = routeOverride
  let api
  const Host = {
    template: '<div />',
    setup() { api = useNavbar(); return {} }
  }
  const wrapper = mount(Host)
  return { api, wrapper }
}

describe('useNavbar (#H12)', () => {
  beforeEach(() => {
    getUser.mockReset()
    pushMock.mockReset()
    logout.mockReset()
    loadNotifications.mockReset()
    currentRoute = { path: '/teacher/dashboard', meta: { title: 'Tableau de bord' } }
  })

  it('expose le titre depuis route.meta.title et charge les notifications au montage', () => {
    getUser.mockReturnValue({ role: 'enseignant', nom: 'Doe', prenom: 'Jane' })
    const { api } = run()
    expect(api.pageTitle.value).toBe('Tableau de bord')
    expect(api.unreadCount.value).toBe(3)
    expect(loadNotifications).toHaveBeenCalled()
  })

  it('retombe sur un titre par défaut sans meta.title', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api } = run({ path: '/teacher/stats', meta: {} })
    expect(api.pageTitle.value).toBe('Statistiques')
  })

  it('calcule les initiales (prenom + nom)', () => {
    getUser.mockReturnValue({ role: 'etudiant', nom: 'Doe', prenom: 'Jane' })
    const { api } = run()
    expect(api.userInitials.value).toBe('JD')
  })

  it('construit le fil d\'Ariane en ignorant les IDs numériques', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api } = run({ path: '/teacher/lessons/42', meta: {} })
    const labels = api.breadcrumbs.value.map(c => c.label)
    expect(labels).toEqual(['Enseignant', 'Leçons'])
    // l'ID final est ignoré : le crumb 'Leçons' n'est donc pas le dernier segment
    // et conserve son lien (comportement d'origine préservé)
    expect(api.breadcrumbs.value.at(-1).to).toBe('/teacher/lessons')
  })

  it('redirige le breadcrumb admin évaluations vers la page résultats existante', () => {
    getUser.mockReturnValue({ role: 'coordinateur' })
    const { api } = run({ path: '/admin/evaluations/2/details', meta: {} })
    const evaluationsCrumb = api.breadcrumbs.value.find(c => c.label === 'Évaluations')
    expect(evaluationsCrumb.to).toBe('/admin/evaluations/results')
  })

  it('redirige le breadcrumb coordinateur vers le dashboard existant', () => {
    getUser.mockReturnValue({ role: 'coordinateur' })
    const { api } = run({ path: '/coordinateur/seances', meta: {} })
    const coordinateurCrumb = api.breadcrumbs.value.find(c => c.label === 'Coordinateur')
    expect(coordinateurCrumb.to).toBe('/admin/dashboard')
  })

  it('ne génère pas de liens invalides pour les parents purement structurels', () => {
    getUser.mockReturnValue({ role: 'coordinateur' })
    const { api } = run({ path: '/classes/12', meta: {} })
    const classesCrumb = api.breadcrumbs.value.find(c => c.label === 'Classes')
    expect(classesCrumb.to).toBe(null)
  })

  it('dérive les URLs profil/paramètres selon le rôle (enseignant)', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api } = run()
    expect(api.profileUrl.value).toBe('/teacher/profile')
    expect(api.settingsUrl.value).toBe('/teacher/settings')
  })

  it('bascule les menus de façon exclusive', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api } = run()
    api.toggleUserMenu()
    expect(api.showUserMenu.value).toBe(true)
    api.toggleNotifications()
    expect(api.showNotifications.value).toBe(true)
    expect(api.showUserMenu.value).toBe(false)
  })

  it('déconnecte et redirige vers /login', () => {
    getUser.mockReturnValue({ role: 'enseignant' })
    const { api } = run()
    api.handleLogout()
    expect(logout).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/login')
  })
})
