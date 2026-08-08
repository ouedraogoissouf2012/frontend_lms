/**
 * Parité du tableau de routes après éclatement par domaine (#H12).
 *
 * router/index.js assemble désormais coreRoutes + adminRoutes + teacherRoutes +
 * studentRoutes + sharedRoutes (définitions déplacées verbatim). Ce test verrouille
 * que l'assemblage produit les routes attendues, dans le même ordre, avec
 * les mêmes name/meta que le tableau monolithique hors route visio iframe legacy.
 */
import { describe, it, expect, vi } from 'vitest'

// Service auth mocké : core.routes l'importe (utilisé dans les redirect runtime,
// pas à l'import). Évite de charger la vraie couche API.
vi.mock('@/services/api', () => ({
  auth: { getUser: () => null, isAuthenticated: () => false }
}))

import { coreRoutes } from '@/router/routes/core.routes'
import { adminRoutes } from '@/router/routes/admin.routes'
import { teacherRoutes } from '@/router/routes/teacher.routes'
import { studentRoutes } from '@/router/routes/student.routes'
import { sharedRoutes } from '@/router/routes/shared.routes'
import { fallbackRoutes } from '@/router/routes/fallback.routes'
import { normalizeRole } from '@/constants/roles'

const assembled = [
  ...coreRoutes,
  ...adminRoutes,
  ...teacherRoutes,
  ...studentRoutes,
  ...sharedRoutes,
  ...fallbackRoutes
]

const CATCH_ALL_PATH = '/:pathMatch(.*)*'

// Ordre EXACT attendu (identique à l'ancien tableau monolithique de router/index.js)
const EXPECTED_PATHS = [
  // core
  '/login', '/', '/admin',
  // admin
  '/admin/dashboard', '/admin/users', '/admin/hub', '/admin/classes', '/admin/matieres',
  '/admin/enseignants', '/admin/seances', '/admin/visioconferences', '/admin/stats',
  '/admin/evaluations/results', '/admin/evaluations/:id/details', '/admin/profile',
  '/admin/settings', '/admin/institutions',
  // teacher
  '/teacher', '/teacher/dashboard', '/teacher/seances', '/teacher/schedule', '/teacher/hub',
  '/teacher/classes', '/teacher/stats', '/teacher/profile', '/teacher/visio-list',
  '/teacher/settings', '/teacher/evaluations/:id/corrections',
  // student
  '/student', '/student/dashboard', '/student/courses', '/student/lessons/:id',
  '/student/evaluations-list', '/student/grades', '/student/visio-list', '/student/settings',
  '/student/schedule', '/student/seances',
  // shared
  '/dashboard', '/lessons/:id', '/teacher/lessons/create', '/teacher/lessons/:id/edit',
  '/teacher/matieres', '/teacher/lessons', '/teacher/lessons/:id/chapters', '/quizzes',
  '/quizzes/:id/take', '/forum', '/forum/topics/:id',
  '/teacher/evaluations', '/teacher/evaluations/create', '/teacher/evaluations/create-questions',
  '/teacher/evaluations/:id/edit-questions', '/student/evaluations',
  '/student/evaluations/:id/take', '/student/evaluations/:id/results',
  '/teacher/evaluations/:id/preview', '/coordinateur/evaluations/:id/preview', '/matieres/:id',
  '/classes/:id', '/seances', '/seances/:id', '/attendance/seances',
  '/attendance/seances/:seanceId', '/coordinateur/evaluations', '/coordinateur/seances',
  // fallback (catch-all 404) — TOUJOURS en dernier
  CATCH_ALL_PATH
]

describe('router routes (#H12) — parité de l\'assemblage', () => {
  it('produit les routes attendues dans l\'ordre exact', () => {
    expect(assembled.map(r => r.path)).toEqual(EXPECTED_PATHS)
  })

  it('aucun path en double', () => {
    const paths = assembled.map(r => r.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('préserve name + meta.roles sur des routes représentatives', () => {
    const byPath = Object.fromEntries(assembled.map(r => [r.path, r]))

    expect(byPath['/admin/dashboard'].meta.roles).toContain('admin')

    expect(byPath['/admin/users'].name).toBe('AdminUsers')
    expect(byPath['/admin/users'].meta.roles).toEqual(['superAdmin', 'admin', 'coordinateur'])

    expect(byPath['/admin/institutions'].meta.roles).toEqual(['supradmin'])

    expect(byPath['/teacher/dashboard'].meta.roles).toEqual(['enseignant', 'teacher'])

    expect(byPath['/student/lessons/:id'].meta.hideLayout).toBe(true)

    expect(byPath['/coordinateur/seances'].name).toBe('seance-management')
  })

  it('conserve les routes lazy (component = factory) et les redirects', () => {
    const byPath = Object.fromEntries(assembled.map(r => [r.path, r]))
    // route normale : component est une factory de lazy import
    expect(typeof byPath['/admin/users'].component).toBe('function')
    // redirect statique
    expect(byPath['/teacher'].redirect).toBe('/teacher/dashboard')
    // redirect dynamique (fonction)
    expect(typeof byPath['/student/seances'].redirect).toBe('function')
  })
})

describe('route de repli 404 (catch-all)', () => {
  it('existe une et une seule fois', () => {
    const matches = assembled.filter(r => r.path === CATCH_ALL_PATH)
    expect(matches).toHaveLength(1)
    expect(matches[0].name).toBe('NotFound')
  })

  it('est la DERNIÈRE route du tableau assemblé', () => {
    expect(assembled[assembled.length - 1].path).toBe(CATCH_ALL_PATH)
  })

  it('est lazy (component = factory), comme toute route du projet (#27)', () => {
    const catchAll = assembled[assembled.length - 1]
    expect(typeof catchAll.component).toBe('function')
    expect(catchAll.redirect).toBeUndefined()
  })

  it('reste PUBLIQUE : sinon un visiteur non authentifié serait redirigé vers /login', () => {
    const catchAll = assembled[assembled.length - 1]
    expect(catchAll.meta?.requiresAuth).toBeUndefined()
    expect(catchAll.meta?.roles).toBeUndefined()
    expect(catchAll.meta?.guest).toBeUndefined()
  })
})

/**
 * Reliquat de l'issue #12 : le `||` permissif du guard a bien été supprimé, mais
 * dix routes `requiresAuth: true` étaient restées SANS `meta.roles` — n'importe
 * quelle session y accédait, l'autorisation reposant entièrement sur le backend.
 * Ce bloc verrouille l'invariant pour empêcher toute récidive.
 */
describe('meta.roles — invariant sur les routes protégées', () => {
  // Exceptions EXPLICITES — toute nouvelle entrée doit être justifiée en revue.
  //
  // '/dashboard' : filet de sécurité atteint quand le rôle n'est PAS
  // normalisable (repli de useNavbar.js:51,59). Lui poser des `roles` ferait
  // rediriger ce cas vers getDashboardRoute() = '/login' (roles.js:141-144),
  // que le guard renvoie lui-même vers '/login' (guards.js:28-30) → boucle de
  // redirection. La vue n'expose que les données de l'utilisateur courant.
  const EXCEPTIONS_JUSTIFIEES = ['/dashboard']

  const protectedRoutes = assembled.filter(r => r.meta?.requiresAuth === true)

  it('couvre bien un ensemble non vide de routes protégées', () => {
    expect(protectedRoutes.length).toBeGreaterThan(50)
  })

  it('toute route requiresAuth déclare des roles non vides', () => {
    const sansRoles = protectedRoutes
      .filter(r => !EXCEPTIONS_JUSTIFIEES.includes(r.path))
      .filter(r => !Array.isArray(r.meta.roles) || r.meta.roles.length === 0)
      .map(r => r.path)

    expect(sansRoles).toEqual([])
  })

  it('ne déclare que des rôles reconnus par constants/roles.js', () => {
    const inconnus = protectedRoutes
      .flatMap(r => (r.meta.roles ?? []).map(role => ({ path: r.path, role })))
      .filter(({ role }) => normalizeRole(role) === null)
      .map(({ path, role }) => `${path} → ${role}`)

    expect(inconnus).toEqual([])
  })

  it('/dashboard reste l\'unique exception documentée (pas de roles)', () => {
    const byPath = Object.fromEntries(assembled.map(r => [r.path, r]))
    expect(EXCEPTIONS_JUSTIFIEES).toEqual(['/dashboard'])
    expect(byPath['/dashboard'].meta.roles).toBeUndefined()
  })

  it('les 9 autres routes du reliquat #12 portent un périmètre explicite', () => {
    const byPath = Object.fromEntries(assembled.map(r => [r.path, r]))
    const RELIQUAT_12 = [
      '/quizzes', '/quizzes/:id/take', '/forum', '/forum/topics/:id',
      '/matieres/:id', '/classes/:id', '/seances/:id',
      '/attendance/seances', '/attendance/seances/:seanceId'
    ]

    const sansPerimetre = RELIQUAT_12.filter(path => {
      const roles = byPath[path]?.meta?.roles
      return !Array.isArray(roles) || roles.length === 0
    })
    expect(sansPerimetre).toEqual([])

    // L'historique des présences est le seul périmètre réellement resserré :
    // aucun écran étudiant n'y mène (navigation.js:86, useMobileSidebar.js:65,73).
    expect(byPath['/attendance/seances'].meta.roles).not.toContain('etudiant')
    expect(byPath['/attendance/seances/:seanceId'].meta.roles).not.toContain('etudiant')

    // À l'inverse, /matieres/:id et /seances/:id gèrent explicitement l'étudiant
    // (utils/matiereDetails.js:125, useSeanceDetails.js:54) : il doit rester listé.
    expect(byPath['/matieres/:id'].meta.roles).toContain('etudiant')
    expect(byPath['/seances/:id'].meta.roles).toContain('etudiant')
  })
})
