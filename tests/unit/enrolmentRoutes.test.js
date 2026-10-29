/**
 * Routes du code d'inscription (#391) : gardées par le rôle ET par la capacité
 * `peutInscrireLocalement` (lue par guards.js:55). Sans capacité, la garde renvoie
 * l'utilisateur à son tableau de bord au lieu d'ouvrir un écran que le serveur refuse.
 */
import { describe, it, expect } from 'vitest'
import { adminRoutes } from '@/router/routes/admin.routes'
import { studentRoutes } from '@/router/routes/student.routes'

const route = (routes, path) => routes.find((r) => r.path === path)

describe('routes du code d’inscription (#391)', () => {
  it('personnel : /admin/enrolment-codes, rôles de la route back, capacité exigée', () => {
    const r = route(adminRoutes, '/admin/enrolment-codes')
    expect(r.meta).toMatchObject({ requiresAuth: true, capacite: 'peutInscrireLocalement' })
    expect(r.meta.roles).toEqual(['superAdmin', 'admin', 'coordinateur'])
    expect(typeof r.component).toBe('function')
  })

  it('élève : /student/rejoindre, rôle etudiant, capacité exigée', () => {
    const r = route(studentRoutes, '/student/rejoindre')
    expect(r.meta).toMatchObject({ requiresAuth: true, roles: ['etudiant'], capacite: 'peutInscrireLocalement' })
    expect(typeof r.component).toBe('function')
  })
})
