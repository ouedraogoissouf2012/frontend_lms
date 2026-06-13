/**
 * Premier test unitaire sous Vitest (#21) — logique de rôles (src/utils/roles.js).
 *
 * Cible une brique d'accès aujourd'hui sans couverture. Sert aussi de filet de
 * régression pour le futur refactor des rôles (#18, enum gelé + supradmin).
 * Import via l'alias `@` pour vérifier que la résolution Vite est bien câblée.
 */
import { describe, it, expect } from 'vitest'
import {
  ROLES,
  getDashboardRoute,
  hasRole,
  isAdmin,
  isTeacher,
  isStudent,
  getRoleDisplayName,
} from '@/utils/roles'

describe('utils/roles — getDashboardRoute', () => {
  it('redirige les rôles admin vers /admin/dashboard', () => {
    for (const role of [ROLES.SUPER_ADMIN, ROLES.COORDINATEUR, ROLES.SECRETAIRE]) {
      expect(getDashboardRoute(role)).toBe('/admin/dashboard')
    }
  })

  it('redirige enseignant et teacher vers /teacher/dashboard', () => {
    expect(getDashboardRoute(ROLES.ENSEIGNANT)).toBe('/teacher/dashboard')
    expect(getDashboardRoute(ROLES.TEACHER)).toBe('/teacher/dashboard')
  })

  it('redirige étudiant vers /student/dashboard', () => {
    expect(getDashboardRoute(ROLES.ETUDIANT)).toBe('/student/dashboard')
  })

  it('sans rôle (null/undefined/vide) redirige vers /login', () => {
    expect(getDashboardRoute(null)).toBe('/login')
    expect(getDashboardRoute(undefined)).toBe('/login')
    expect(getDashboardRoute('')).toBe('/login')
  })

  it('rôle inconnu retombe sur le fallback /dashboard', () => {
    expect(getDashboardRoute('hacker')).toBe('/dashboard')
  })
})

describe('utils/roles — gardes de rôle', () => {
  it('hasRole gère un user nul et un tableau de rôles', () => {
    expect(hasRole(null, ROLES.ETUDIANT)).toBe(false)
    expect(hasRole({ role: 'etudiant' }, ['etudiant', 'teacher'])).toBe(true)
    expect(hasRole({ role: 'etudiant' }, 'teacher')).toBe(false)
  })

  it('isAdmin / isTeacher / isStudent reflètent le rôle', () => {
    expect(isAdmin({ role: ROLES.COORDINATEUR })).toBe(true)
    expect(isAdmin({ role: ROLES.ETUDIANT })).toBe(false)
    expect(isTeacher({ role: ROLES.TEACHER })).toBe(true)
    expect(isStudent({ role: ROLES.ETUDIANT })).toBe(true)
  })

  it('getRoleDisplayName retourne un libellé connu ou le rôle brut', () => {
    expect(getRoleDisplayName(ROLES.SUPER_ADMIN)).toBe('Super Administrateur')
    expect(getRoleDisplayName('inconnu')).toBe('inconnu')
  })
})
