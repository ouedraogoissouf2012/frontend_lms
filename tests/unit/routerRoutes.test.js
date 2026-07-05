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

const assembled = [
  ...coreRoutes,
  ...adminRoutes,
  ...teacherRoutes,
  ...studentRoutes,
  ...sharedRoutes
]

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
  '/attendance/seances/:seanceId', '/coordinateur/evaluations', '/coordinateur/seances'
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
