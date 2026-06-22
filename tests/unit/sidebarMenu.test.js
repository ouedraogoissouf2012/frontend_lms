/**
 * Tests PURS de buildMenuSections (G9 — extraction de Sidebar.vue).
 *
 * Verrouille la parité du menu construit selon le rôle : mêmes entrées, mêmes
 * `to`, même ordre que la `computed menuSections` d'origine. Les helpers de rôle
 * réels (@/constants/roles) sont utilisés (pas de mock) pour tester la vraie
 * table d'alias.
 */
import { describe, it, expect } from 'vitest'
import { buildMenuSections } from '@/utils/sidebarMenu'

const routesOf = (menu) => menu.map((m) => m.to)

describe('buildMenuSections (G9)', () => {
  it('retourne [] sans utilisateur', () => {
    expect(buildMenuSections(null)).toEqual([])
    expect(buildMenuSections(undefined)).toEqual([])
  })

  it('supradmin : menu minimal (Institutions uniquement)', () => {
    const menu = buildMenuSections({ role: 'supradmin' })
    expect(menu).toEqual([
      { icon: 'fa-university', label: 'Institutions', to: '/admin/institutions' }
    ])
    // L'alias superAdmin doit donner le même menu minimal.
    expect(buildMenuSections({ role: 'superAdmin' })).toEqual(menu)
  })

  it('étudiant : 7 entrées dans l\'ordre attendu', () => {
    const menu = buildMenuSections({ role: 'etudiant' })
    expect(routesOf(menu)).toEqual([
      '/student/dashboard',
      '/student/courses',
      '/student/schedule',
      '/student/evaluations-list',
      '/student/grades',
      '/forum',
      '/student/settings'
    ])
  })

  it('enseignant : dashboard teacher + 4 entrées teacher + forum/historique/paramètres', () => {
    const menu = buildMenuSections({ role: 'enseignant' })
    expect(routesOf(menu)).toEqual([
      '/teacher/dashboard',
      '/teacher/schedule',
      '/teacher/hub',
      '/teacher/evaluations',
      '/forum',
      '/attendance/seances',
      '/teacher/settings'
    ])
  })

  it('coordinateur : dashboard admin + évaluations coordinateur + espace admin', () => {
    const menu = buildMenuSections({ role: 'coordinateur' })
    expect(routesOf(menu)).toEqual([
      '/admin/dashboard',
      '/coordinateur/evaluations',
      '/admin/hub',
      '/admin/evaluations/results',
      '/coordinateur/seances',
      '/forum',
      '/attendance/seances',
      '/admin/settings'
    ])
  })

  it('admin : menu administratif étendu', () => {
    const menu = buildMenuSections({ role: 'admin' })
    expect(routesOf(menu)).toEqual([
      '/admin/dashboard',
      '/admin/users',
      '/admin/classes',
      '/admin/matieres',
      '/admin/enseignants',
      '/admin/seances',
      '/admin/visioconferences',
      '/admin/evaluations/results',
      '/admin/stats',
      '/forum',
      '/attendance/seances',
      '/admin/settings'
    ])
  })

  it('chaque entrée porte icon/label/to non vides', () => {
    for (const role of ['etudiant', 'enseignant', 'coordinateur', 'admin']) {
      for (const item of buildMenuSections({ role })) {
        expect(item.icon).toBeTruthy()
        expect(item.label).toBeTruthy()
        expect(item.to).toBeTruthy()
      }
    }
  })
})
