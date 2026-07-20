/**
 * Tests des widgets d'aperçu du dashboard admin/coordinateur : le tableau de bord
 * doit rester synthétique et ne pas rendre les listes KLASSCI complètes.
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardClasses from '@/components/dashboard/DashboardClasses.vue'
import DashboardMatieres from '@/components/dashboard/DashboardMatieres.vue'
import DashboardRecentUsers from '@/components/dashboard/DashboardRecentUsers.vue'

const RouterLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }
const global = { stubs: { 'router-link': RouterLinkStub, RouterLink: RouterLinkStub } }

describe('Dashboard preview widgets', () => {
  it('DashboardClasses limite l\'aperçu et garde un lien vers la liste complète', () => {
    const classes = Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      name: `Classe ${index + 1}`,
      niveau: { name: 'Licence' },
      filiere: { name: 'Gestion', code: 'GES' },
      is_active: true,
    }))

    const w = mount(DashboardClasses, { props: { classes, limit: 3 }, global })

    expect(w.findAll('.class-card')).toHaveLength(3)
    expect(w.text()).toContain('3/8')
    expect(w.text()).toContain('5 autres classes disponibles')
    expect(w.text()).not.toContain('Classe 4')
    expect(w.find('a[href="/admin/classes"]').exists()).toBe(true)
  })

  it('DashboardMatieres limite les matières affichées', () => {
    const matieres = Array.from({ length: 15 }, (_, index) => ({
      id: index + 1,
      nom: `Matière ${index + 1}`,
      code: `M${index + 1}`,
    }))

    const w = mount(DashboardMatieres, { props: { matieres, limit: 4 }, global })

    expect(w.findAll('.matiere-card')).toHaveLength(4)
    expect(w.text()).toContain('4/15')
    expect(w.text()).toContain('11 autres matières disponibles')
    expect(w.text()).not.toContain('Matière 5')
    expect(w.find('a[href="/admin/matieres"]').exists()).toBe(true)
  })

  it('DashboardRecentUsers limite les utilisateurs récents', () => {
    const users = Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      name: `User ${index + 1}`,
      email: `user${index + 1}@test.com`,
      role: 'etudiant',
      created_at: '2026-07-15T08:00:00Z',
    }))

    const w = mount(DashboardRecentUsers, { props: { users, limit: 5 }, global })

    expect(w.findAll('.user-item')).toHaveLength(5)
    expect(w.text()).toContain('5/7')
    expect(w.text()).toContain('2 autres utilisateurs récents')
    expect(w.text()).not.toContain('User 6')
    expect(w.find('a[href="/admin/users"]').exists()).toBe(true)
  })
})
