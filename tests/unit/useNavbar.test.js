/**
 * Tests de la logique useNavbar (#H12) — services/router/useNotifications mockés.
 * On exécute le composable dans un composant hôte (il dépend de useRoute/onMounted),
 * et on vérifie : titre de page, fil d'Ariane, initiales, URLs selon le rôle,
 * bascule exclusive des menus et déconnexion.
 */
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
const markAsReadSvc = vi.fn()
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    notifications: ref([]),
    unreadCount: ref(3),
    markAsRead: (...a) => markAsReadSvc(...a),
    markAllAsRead: markAllAsReadSvc,
    loadNotifications
  })
}))

const toastInfo = vi.fn()
vi.mock('@/composables/useToast', () => ({
  toast: { info: (...a) => toastInfo(...a) }
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

describe('useNavbar — clic sur une notification', () => {
  const B = String.fromCharCode(92)
  const simple = { ctrlKey: false, metaKey: false }
  const ctrl = { ctrlKey: true, metaKey: false }
  let openSpy

  beforeEach(() => {
    getUser.mockReturnValue({ role: 'etudiant' })
    pushMock.mockReset()
    markAsReadSvc.mockReset()
    markAsReadSvc.mockResolvedValue(true)
    toastInfo.mockReset()
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    openSpy.mockRestore()
  })

  async function cliquer(actionUrl, event) {
    const { api } = run()
    api.showNotifications.value = true
    await api.handleNotificationClick({ id: 7, action_url: actionUrl }, event)
    return api
  }

  it('suit un chemin interne par le routeur et ferme le panneau', async () => {
    const api = await cliquer('/lessons/12', simple)
    expect(markAsReadSvc).toHaveBeenCalledWith(7)
    expect(pushMock).toHaveBeenCalledWith('/lessons/12')
    expect(api.showNotifications.value).toBe(false)
    expect(openSpy).not.toHaveBeenCalled()
    expect(toastInfo).not.toHaveBeenCalled()
  })

  it('ouvre un chemin interne dans un nouvel onglet, sans opener, au Ctrl-clic', async () => {
    await cliquer('/lessons/12?x=1#c', ctrl)
    expect(openSpy).toHaveBeenCalledTimes(1)
    const [url, cibleFenetre, options] = openSpy.mock.calls[0]
    // Le href RÉSOLU, absolu et de même origine — jamais le chemin seul.
    expect([url, cibleFenetre]).toEqual([`${window.location.origin}/lessons/12?x=1#c`, '_blank'])
    expect(options).toContain('noopener')
    expect(options).toContain('noreferrer')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it.each([[simple, 'clic simple'], [ctrl, 'Ctrl-clic']])(
    'ouvre une URL absolue d une autre origine sans opener (%#, %s)',
    async (event) => {
      await cliquer('https://a.test/page', event)
      expect(openSpy).toHaveBeenCalledTimes(1)
      const [url, cibleFenetre, options] = openSpy.mock.calls[0]
      expect([url, cibleFenetre]).toEqual(['https://a.test/page', '_blank'])
      expect(options).toContain('noopener')
      expect(options).toContain('noreferrer')
      expect(pushMock).not.toHaveBeenCalled()
    }
  )

  it('ouvre le href RÉSOLU par la garde commune, jamais la chaîne reçue', async () => {
    // Casse, espaces et caractère de contrôle : la chaîne reçue diffère de sa forme résolue.
    await cliquer(' HTTPS://A.TEST/pa\tge ', simple)
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy.mock.calls[0][0]).toBe('https://a.test/page')
  })

  const refuses = [
    'javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,x',
    'vbscript:x',
    '//evil.test/x',
    `/${B}evil.test/x`,
    `${B}${B}evil.test`,
    '/.//evil.test/x',
    '/a/..//evil.test/x',
    `${window.location.origin}//evil.test/x`,
  ]

  describe.each([[simple, 'clic simple'], [ctrl, 'Ctrl-clic']])('lien refusé (%#, %s)', (event) => {
    it.each(refuses)('ne navigue pas vers %j, le dit sans l URL, et garde la notification lue', async (raw) => {
      const api = await cliquer(raw, event)
      expect(pushMock).not.toHaveBeenCalled()
      expect(openSpy).not.toHaveBeenCalled()
      expect(markAsReadSvc).toHaveBeenCalledWith(7)
      expect(api.showNotifications.value).toBe(true)
      expect(toastInfo).toHaveBeenCalledTimes(1)
      expect(toastInfo.mock.calls[0][0]).toBe("Ce lien n'est pas disponible.")
      const args = JSON.stringify(toastInfo.mock.calls)
      expect(args).not.toContain('evil')
      expect(args).not.toContain('script')
      expect(args).not.toContain('data:')
    })
  })

  it('ne fait rien, sans message, quand la notification n a pas de lien', async () => {
    await cliquer(null, simple)
    expect(markAsReadSvc).toHaveBeenCalledWith(7)
    expect(pushMock).not.toHaveBeenCalled()
    expect(openSpy).not.toHaveBeenCalled()
    expect(toastInfo).not.toHaveBeenCalled()
  })
})
