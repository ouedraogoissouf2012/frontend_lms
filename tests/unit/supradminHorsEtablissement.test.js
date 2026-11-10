/**
 * Le supradmin (plateforme, sans établissement) sur un écran d'école : une orientation, pas une
 * erreur.
 *
 * Constat E2E (R3, 09/11/2026) : le garde du routeur laisse passer le supradmin partout
 * (`canActivate` : `hasRole(...) || isSupradmin(user)`). Sur /dashboard et /forum, routes
 * ouvertes à tout compte connecté, l'écran demandait du contenu d'école. Le serveur le refuse
 * (D56), et l'écran affichait à l'exploitant de la plateforme « Votre compte n'est rattaché à aucun
 * établissement. Contactez votre administrateur. ». Le conseil est faux : le supradmin n'a pas
 * d'administrateur, et il n'a pas vocation à avoir un établissement.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  user: null,
  getAll: vi.fn(), getStudentDashboard: vi.fn(), getTeacherDashboard: vi.fn(),
  notifs: vi.fn(), getTopics: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), RouterLink: { template: '<a><slot /></a>' } }))
vi.mock('@/composables/useToast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/services/api', () => ({
  auth: { getUser: () => h.user },
  dashboard: { getStudentDashboard: (...a) => h.getStudentDashboard(...a), getTeacherDashboard: (...a) => h.getTeacherDashboard(...a) },
  lessons: { getAll: (...a) => h.getAll(...a) },
  notifications: { getAll: (...a) => h.notifs(...a) },
  forum: { getTopics: (...a) => h.getTopics(...a) },
}))

import Dashboard from '@/views/Dashboard.vue'
import { getDashboardRoute, ROLES } from '@/constants/roles'
import Forum from '@/views/Forum.vue'

const SUPRADMIN = { id: 1, name: 'Supradmin', role: 'supradmin' }
const ELEVE = { id: 9, name: 'Eleve', role: 'etudiant' }
// Le lien rend sa CIBLE (`to`) : la revue a relevé qu'un stub muet ne vérifiait pas où il mène.
const globale = { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, 'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' } } }

async function monter(vue) {
  const w = mount(vue, { global: globale })
  await flushPromises()
  return w
}

beforeEach(() => {
  for (const f of ['getAll', 'getStudentDashboard', 'getTeacherDashboard', 'notifs', 'getTopics']) h[f].mockReset()
  h.getAll.mockResolvedValue({ success: true, data: { data: [] } })
  h.notifs.mockResolvedValue([])
  h.getTopics.mockResolvedValue({ success: true, data: [] })
  h.getStudentDashboard.mockResolvedValue(null)
})

describe('/dashboard pour le supradmin', () => {
  it('ne demande aucun contenu d’école, n’affiche aucune erreur, oriente vers son espace', async () => {
    h.user = SUPRADMIN
    const w = await monter(Dashboard)
    expect(h.getAll).not.toHaveBeenCalled()
    expect(w.text()).not.toMatch(/rattaché à aucun établissement/)
    expect(w.find('[data-test="hors-etablissement"]').exists()).toBe(true)
    expect(w.text()).toContain('Institutions')
  })

  it('un élève garde ses leçons récentes, sans l’orientation du supradmin', async () => {
    h.user = ELEVE
    const w = await monter(Dashboard)
    expect(h.getAll).toHaveBeenCalled()
    expect(w.find('[data-test="hors-etablissement"]').exists()).toBe(false)
  })
})

describe('/forum pour le supradmin', () => {
  it('ne demande aucun sujet, n’affiche ni erreur ni « Nouvelle discussion », oriente vers son espace', async () => {
    h.user = SUPRADMIN
    const w = await monter(Forum)
    expect(h.getTopics).not.toHaveBeenCalled()
    expect(w.text()).not.toMatch(/rattaché à aucun établissement/)
    expect(w.text()).not.toContain('Nouvelle discussion')
    expect(w.find('[data-test="hors-etablissement"]').exists()).toBe(true)
  })

  it('un élève voit le forum de son école', async () => {
    h.user = ELEVE
    const w = await monter(Forum)
    expect(h.getTopics).toHaveBeenCalled()
    expect(w.find('[data-test="hors-etablissement"]').exists()).toBe(false)
  })
})

describe('le texte d’orientation dit vrai et mène à l’espace du supradmin (revue de #509)', () => {
  it('le lien mène à l’espace du supradmin', async () => {
    h.user = SUPRADMIN
    const w = await monter(Forum)
    const lien = w.find('[data-test="hors-etablissement"] a')
    expect(lien.attributes('href')).toBe(getDashboardRoute(ROLES.SUPRADMIN))
  })

  it('le texte ne prétend pas que la plateforme n’a pas d’établissements', async () => {
    h.user = SUPRADMIN
    const w = await monter(Forum)
    const texte = w.find('[data-test="hors-etablissement"]').text()
    expect(texte).not.toMatch(/la plateforme n.en a pas/)
    expect(texte).toMatch(/relève d.un établissement/)
    expect(texte).toMatch(/Votre compte gère la plateforme/)
  })
})
