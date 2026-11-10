/**
 * Le supradmin n'ouvre que les routes de PLATEFORME (D56, D125, D126).
 *
 * Décision de l'utilisateur (D56) : le supradmin — l'exploitant de la plateforme, sans établissement —
 * ne voit aucun contenu d'école ; seules exceptions, le journal d'audit (D51) et les préférences de
 * notification (D54). Le garde le laissait pourtant passer PARTOUT (`hasRole(...) || isSupradmin`) :
 * sur /dashboard, /forum, /classes/:id, /attendance/seances… l'écran demandait du contenu d'école,
 * le serveur le refusait (`no_institution`) et l'écran lui disait « Contactez votre administrateur ».
 *
 * Règle : une LISTE D'AUTORISATION. Une route ne s'ouvre au supradmin que si elle porte
 * `meta.plateforme: true` ; toute autre route authentifiée le renvoie vers son espace. Un nouvel
 * écran oublié lui est donc FERMÉ par défaut (le côté sûr).
 */
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  isAuthenticated: vi.fn(), getUser: vi.fn(),
  klassci: { getClasses: vi.fn(), getMatieres: vi.fn(), getEnseignants: vi.fn() },
}))
vi.mock('@/services/api', () => ({ auth: { isAuthenticated: () => h.isAuthenticated(), getUser: () => h.getUser(), getMeta: () => null } }))
vi.mock('@/services/klassci', () => ({ klassciService: h.klassci, default: h.klassci }))
vi.mock('@/components/layout/DashboardLayout.vue', () => ({ default: { template: '<div><slot /></div>' } }))

import { canActivate, getDashboardRoute, ROLES } from '@/constants/roles'
import { navigationGuard } from '@/router/guards'
import { coreRoutes } from '@/router/routes/core.routes'
import { adminRoutes } from '@/router/routes/admin.routes'
import { teacherRoutes } from '@/router/routes/teacher.routes'
import { studentRoutes } from '@/router/routes/student.routes'
import { sharedRoutes } from '@/router/routes/shared.routes'
import { fallbackRoutes } from '@/router/routes/fallback.routes'
import { useAdminProfile } from '@/composables/useAdminProfile'
import AdminProfile from '@/views/admin/AdminProfile.vue'
import ProfileActionsCard from '@/components/admin/ProfileActionsCard.vue'
import ProfileStatsCard from '@/components/admin/ProfileStatsCard.vue'

const SUPRADMIN = { id: 1, role: 'supradmin' }
const ESPACE = getDashboardRoute(ROLES.SUPRADMIN)
const aplatir = (routes) => routes.flatMap((r) => [r, ...aplatir(r.children ?? [])])
const TOUTES = aplatir([...coreRoutes, ...adminRoutes, ...teacherRoutes, ...studentRoutes, ...sharedRoutes, ...fallbackRoutes])

// La liste FERMÉE des routes de plateforme (D126) : son menu (Institutions, Demandes), son profil et
// ses paramètres (préférences d'affichage, gardées dans le navigateur : aucune donnée d'école). Le
// journal d'audit (D51, écran D126).
const PLATEFORME = ['/admin/audit-log', '/admin/institutions', '/admin/profile', '/admin/school-requests', '/admin/settings']

describe('canActivate — le supradmin n’ouvre que les routes de plateforme', () => {
  it('route d’école (rôles qui ne le nomment pas) : refusée, renvoi vers son espace', () => {
    const d = canActivate(SUPRADMIN, ['enseignant'])
    expect(d.allowed).toBe(false)
    expect(d.redirectTo).toBe(ESPACE)
  })

  it('route d’école ouverte à tous les comptes (sans rôles, ex. /dashboard) : refusée aussi', () => {
    expect(canActivate(SUPRADMIN, undefined).allowed).toBe(false)
  })

  it('route de plateforme : ouverte, quels que soient ses rôles', () => {
    expect(canActivate(SUPRADMIN, ['superAdmin', 'admin', 'coordinateur'], true).allowed).toBe(true)
    expect(canActivate(SUPRADMIN, ['supradmin'], true).allowed).toBe(true)
  })

  it('les autres rôles ne changent pas : le marquage plateforme ne leur ouvre rien', () => {
    expect(canActivate({ role: 'admin' }, ['admin']).allowed).toBe(true)
    expect(canActivate({ role: 'etudiant' }, undefined).allowed).toBe(true)
    expect(canActivate({ role: 'admin' }, ['supradmin'], true).allowed).toBe(false)
  })
})

describe('le tableau des routes : la liste de plateforme est fermée et suivie', () => {
  it('exactement ces routes portent meta.plateforme', () => {
    expect(TOUTES.filter((r) => r.meta?.plateforme === true).map((r) => r.path).sort()).toEqual(PLATEFORME)
  })

  // Revue : le refus le renvoie vers son espace ; si cet espace n'était pas marqué, l'anti-boucle
  // du garde (redirectUnlessCurrent) l'ouvrirait au lieu de le fermer.
  it('l’espace du supradmin est lui-même une route de plateforme', () => {
    expect(TOUTES.find((r) => r.path === ESPACE)?.meta?.plateforme).toBe(true)
  })

  // Revue : vue-router fusionne les `meta` des parents dans `to.meta` ; un enfant d'une route de
  // plateforme hériterait de `plateforme` SANS marquage — le côté non sûr.
  it('aucune route de plateforme n’a d’enfants', () => {
    expect(TOUTES.filter((r) => r.meta?.plateforme === true && r.children?.length).map((r) => r.path)).toEqual([])
  })

  it('aucune route d’école ne nomme encore le supradmin dans ses rôles', () => {
    const fautives = TOUTES
      .filter((r) => r.meta?.plateforme !== true && (r.meta?.roles ?? []).includes('supradmin'))
      .map((r) => r.path)
    expect(fautives).toEqual([])
  })
})

describe('le garde du routeur', () => {
  beforeEach(() => {
    h.isAuthenticated.mockReturnValue(true)
    h.getUser.mockReturnValue(SUPRADMIN)
  })
  const aller = (path) => {
    const route = TOUTES.find((r) => r.path === path)
    const next = vi.fn()
    navigationGuard({ ...route, meta: route.meta ?? {}, name: route.name, path }, { path: '/' }, next)
    return next
  }

  it('/dashboard, /forum, /classes/:id, /attendance/seances : le supradmin est renvoyé vers son espace', () => {
    for (const path of ['/dashboard', '/forum', '/classes/:id', '/attendance/seances', '/admin/dashboard']) {
      expect(aller(path)).toHaveBeenCalledWith(ESPACE)
    }
  })

  it('ses routes de plateforme lui restent ouvertes', () => {
    for (const path of PLATEFORME) expect(aller(path)).toHaveBeenCalledWith()
  })

  // Témoin de non-régression (#409) : le lien d'activation qu'il vient de remettre, et la page 404,
  // ne demandent ni session ni rôle ; le garde n'y juge rien.
  it('le lien d’activation et la page 404 lui restent ouverts', () => {
    for (const path of ['/activation/:token', '/:pathMatch(.*)*']) expect(aller(path)).toHaveBeenCalledWith()
  })
})

describe('/admin/profile pour le supradmin : aucune requête d’école', () => {
  it('ni classes, ni matières, ni enseignants ; aucun compteur d’école à afficher', async () => {
    h.getUser.mockReturnValue(SUPRADMIN)
    for (const f of Object.values(h.klassci)) f.mockReset().mockResolvedValue([])
    let api
    mount(defineComponent({ setup() { api = useAdminProfile(); return () => null } }))
    await flushPromises()
    for (const f of Object.values(h.klassci)) expect(f).not.toHaveBeenCalled()
    expect(api.stats.value).toBeNull()
  })

  // Revue : `stats` ne passait à null qu'au montage, après un premier rendu de la carte (« — »).
  it('dès le premier rendu : aucune carte de compteurs, même un instant', () => {
    h.getUser.mockReturnValue(SUPRADMIN)
    let initial, api
    mount(defineComponent({ setup() { api = useAdminProfile(); initial = api.stats.value; return () => null } }))
    expect(initial).toBeNull()
    expect(api.estPlateforme).toBe(true)
  })

  // Revue : « Actions rapides » lui offrait Utilisateurs, Classes, Matières — trois routes d'école
  // qui le renvoient sans un mot vers son espace.
  it('Actions rapides : le supradmin n’a que ses paramètres, l’admin d’école garde ses 4 liens', () => {
    const liens = (props) => mount(ProfileActionsCard, { props, global: { stubs: { RouterLink: RouterLinkStub } } })
      .findAllComponents(RouterLinkStub).map((l) => l.props('to'))
    expect(liens({ plateforme: true })).toEqual(['/admin/settings'])
    expect(liens({})).toEqual(['/admin/settings', '/admin/users', '/admin/classes', '/admin/matieres'])
  })

  it('la vue câble le tout : ni carte de compteurs, ni lien d’école pour le supradmin', async () => {
    h.getUser.mockReturnValue(SUPRADMIN)
    const vue = mount(AdminProfile, { global: { stubs: { ProfileInfoCard: true, ProfilePermissionsCard: true, ProfileStatsCard: true, ProfileActionsCard: true } } })
    await flushPromises()
    expect(vue.findComponent(ProfileStatsCard).exists()).toBe(false)
    expect(vue.findComponent(ProfileActionsCard).props('plateforme')).toBe(true)
  })

  it('l’admin d’école garde ses compteurs', async () => {
    h.getUser.mockReturnValue({ id: 2, role: 'admin' })
    for (const f of Object.values(h.klassci)) f.mockReset().mockResolvedValue([])
    mount(defineComponent({ setup() { useAdminProfile(); return () => null } }))
    await flushPromises()
    expect(h.klassci.getClasses).toHaveBeenCalled()
  })
})
