/**
 * Tests de la couche d'autorisation (#18) — src/constants/roles.js
 *
 * Couvre : enum gelé, normalizeRole (table d'alias miroir du backend
 * Role::tryFromString + divergence tracée secretaire→coordinateur), helpers
 * fail-secure, getDashboardRoute, getRoleDisplayName, canActivate (partagée
 * runtime/tests). Inclut les régressions #8 (supradmin ne voit pas le menu
 * enseignant) et #12 (coordinateur refusé sur route supradmin) et le multi-variant
 * superAdmin/supradmin. Vitest (#21), import via l'alias `@`.
 */
import { describe, it, expect } from 'vitest'
import {
  ROLES,
  normalizeRole,
  hasRole,
  isSupradmin,
  isAdmin,
  isAdminScope,
  isTeacher,
  isStudent,
  getDashboardRoute,
  getRoleDisplayName,
  canActivate,
} from '@/constants/roles'

describe('ROLES — enum canonique gelé (R1)', () => {
  it('expose exactement les 5 rôles canoniques avec les valeurs backend', () => {
    expect(ROLES).toEqual({
      ETUDIANT: 'etudiant',
      ENSEIGNANT: 'enseignant',
      COORDINATEUR: 'coordinateur',
      ADMIN: 'admin',
      SUPRADMIN: 'supradmin',
    })
  })

  it('est gelé (Object.isFrozen) et rejette toute mutation', () => {
    expect(Object.isFrozen(ROLES)).toBe(true)
    expect(() => { ROLES.ETUDIANT = 'x' }).toThrow()
    expect(() => { ROLES.NOUVEAU = 'y' }).toThrow()
    expect(ROLES.ETUDIANT).toBe('etudiant')
  })
})

describe('normalizeRole — table d\'alias miroir du backend (R2)', () => {
  it.each([
    ['supradmin', 'supradmin'],
    ['superAdmin', 'supradmin'],
    ['etudiant', 'etudiant'],
    ['student', 'etudiant'],
    ['étudiant', 'etudiant'],
    ['enseignant', 'enseignant'],
    ['teacher', 'enseignant'],
    ['coordinateur', 'coordinateur'],
    ['coordinator', 'coordinateur'],
    ['admin', 'admin'],
    ['administrateur', 'admin'],
    ['secretaire', 'coordinateur'], // divergence backend tracée #18-FE-1
  ])('normalise %s → %s', (raw, expected) => {
    expect(normalizeRole(raw)).toBe(expected)
  })

  it.each([null, undefined, '', 42, {}, [], 'hacker', 'SUPRADMIN', 'Student'])(
    'retourne null (fail-soft) pour une valeur non reconnue: %s',
    (raw) => {
      expect(normalizeRole(raw)).toBeNull()
    },
  )
})

describe('helpers — fondés sur le rôle normalisé, fail-secure (R3, R8)', () => {
  it('hasRole compare canonique↔canonique et accepte les alias des deux côtés', () => {
    expect(hasRole({ role: 'superAdmin' }, ['supradmin'])).toBe(true)
    expect(hasRole({ role: 'teacher' }, 'enseignant')).toBe(true)
    expect(hasRole({ role: 'etudiant' }, ['enseignant', 'teacher'])).toBe(false)
    expect(hasRole(null, 'etudiant')).toBe(false)
    expect(hasRole({ role: 'hacker' }, ['admin'])).toBe(false)
  })

  it('isSupradmin (=== supradmin) reconnaît les deux variantes (R3.3, R5.1)', () => {
    expect(isSupradmin({ role: 'supradmin' })).toBe(true)
    expect(isSupradmin({ role: 'superAdmin' })).toBe(true)
    expect(isSupradmin({ role: 'admin' })).toBe(false)
  })

  it('isAdmin = {admin, supradmin} strict (Décision B, R3.4)', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true)
    expect(isAdmin({ role: 'superAdmin' })).toBe(true)
    expect(isAdmin({ role: 'supradmin' })).toBe(true)
    expect(isAdmin({ role: 'coordinateur' })).toBe(false)
    expect(isAdmin({ role: 'secretaire' })).toBe(false) // secretaire→coordinateur, hors isAdmin strict
  })

  it('isAdminScope = {admin, supradmin, coordinateur} pour l\'UI (Décision B)', () => {
    expect(isAdminScope({ role: 'coordinateur' })).toBe(true)
    expect(isAdminScope({ role: 'secretaire' })).toBe(true) // alias→coordinateur
    expect(isAdminScope({ role: 'admin' })).toBe(true)
    expect(isAdminScope({ role: 'supradmin' })).toBe(true)
    expect(isAdminScope({ role: 'enseignant' })).toBe(false)
    expect(isAdminScope({ role: 'etudiant' })).toBe(false)
  })

  it('isTeacher / isStudent via alias (R3.5, R3.6)', () => {
    expect(isTeacher({ role: 'teacher' })).toBe(true)
    expect(isTeacher({ role: 'enseignant' })).toBe(true)
    expect(isTeacher({ role: 'supradmin' })).toBe(false) // régression #8 au niveau helper
    expect(isStudent({ role: 'student' })).toBe(true)
    expect(isStudent({ role: 'etudiant' })).toBe(true)
    expect(isStudent({ role: 'enseignant' })).toBe(false)
  })

  it('tous les helpers booléens sont false sur rôle null/inconnu (fail-secure R8.1)', () => {
    for (const u of [{ role: null }, {}, { role: 'hacker' }, null]) {
      expect(isSupradmin(u)).toBe(false)
      expect(isAdmin(u)).toBe(false)
      expect(isAdminScope(u)).toBe(false)
      expect(isTeacher(u)).toBe(false)
      expect(isStudent(u)).toBe(false)
    }
  })
})

describe('getDashboardRoute — objet ou chaîne, fail-secure (R3.7, R3.9, R8.2)', () => {
  it.each([
    ['supradmin', '/admin/institutions'],
    ['superAdmin', '/admin/institutions'],
    ['admin', '/admin/dashboard'],
    ['coordinateur', '/admin/dashboard'],
    ['secretaire', '/admin/dashboard'], // alias→coordinateur (non-régression accès admin)
    ['enseignant', '/teacher/dashboard'],
    ['teacher', '/teacher/dashboard'],
    ['etudiant', '/student/dashboard'],
  ])('rôle %s → %s', (role, route) => {
    expect(getDashboardRoute(role)).toBe(route)
    expect(getDashboardRoute({ role })).toBe(route)
  })

  it.each([null, undefined, 'hacker', ''])('rôle inconnu %s → /login (neutre)', (role) => {
    expect(getDashboardRoute(role)).toBe('/login')
  })
})

describe('getRoleDisplayName — libellé unique par canonique (R4.3)', () => {
  it('un même rôle a un libellé stable quelle que soit la variante', () => {
    expect(getRoleDisplayName('supradmin')).toBe(getRoleDisplayName('superAdmin'))
    expect(getRoleDisplayName('supradmin')).toBe('Super Administrateur')
    expect(getRoleDisplayName('admin')).toBe('Administrateur')
    expect(getRoleDisplayName('coordinateur')).toBe('Coordinateur')
    expect(getRoleDisplayName('enseignant')).toBe('Enseignant')
    expect(getRoleDisplayName('etudiant')).toBe('Étudiant')
  })

  it('rôle inconnu → chaîne vide (pas de fuite de valeur brute)', () => {
    expect(getRoleDisplayName('hacker')).toBe('')
    expect(getRoleDisplayName(null)).toBe('')
  })
})

describe('canActivate — décision partagée guard/tests (R6.3, R5.4)', () => {
  it('sans meta.roles → autorisé', () => {
    expect(canActivate({ role: 'etudiant' }, undefined).allowed).toBe(true)
  })

  it('autorise si le rôle normalisé appartient aux rôles requis normalisés (R5.5)', () => {
    expect(canActivate({ role: 'superAdmin' }, ['supradmin']).allowed).toBe(true)
    expect(canActivate({ role: 'enseignant' }, ['enseignant', 'coordinateur']).allowed).toBe(true)
  })

  it('bypass supradmin normalisé (R5.4)', () => {
    expect(canActivate({ role: 'supradmin' }, ['enseignant']).allowed).toBe(true)
    expect(canActivate({ role: 'superAdmin' }, ['etudiant']).allowed).toBe(true)
  })

  it('régression #12 — coordinateur refusé sur route supradmin, redirigé vers son dashboard', () => {
    const d = canActivate({ role: 'coordinateur' }, ['supradmin'])
    expect(d.allowed).toBe(false)
    expect(d.redirectTo).toBe('/admin/dashboard')
  })

  it('rôle inconnu refusé + redirection neutre (fail-secure R8.3)', () => {
    const d = canActivate({ role: 'hacker' }, ['etudiant'])
    expect(d.allowed).toBe(false)
    expect(d.redirectTo).toBe('/login')
  })
})

describe('multi-variant — même décision superAdmin/supradmin (R9.6)', () => {
  it('superAdmin et supradmin produisent la même route et la même décision', () => {
    expect(getDashboardRoute({ role: 'superAdmin' })).toBe(getDashboardRoute({ role: 'supradmin' }))
    expect(canActivate({ role: 'superAdmin' }, ['supradmin']).allowed)
      .toBe(canActivate({ role: 'supradmin' }, ['supradmin']).allowed)
    expect(isTeacher({ role: 'superAdmin' })).toBe(isTeacher({ role: 'supradmin' })) // #8
  })
})
