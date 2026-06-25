/**
 * Test de rendu DashboardRoleActions (#H3 ≤300) : cartes d'actions conditionnelles
 * selon les prédicats de rôle. router-link stubé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DashboardRoleActions from '@/components/dashboard/DashboardRoleActions.vue'

const RouterLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }

function mountIt(props) {
  return mount(DashboardRoleActions, {
    props,
    global: { stubs: { 'router-link': RouterLinkStub } },
  })
}

describe('DashboardRoleActions (#H3)', () => {
  it('enseignant : voit Cours + Évaluations mais pas Séances', () => {
    const w = mountIt({ isTeacher: true, isCoordinateur: false, isSuperAdmin: false })
    expect(w.findAll('.action-card')).toHaveLength(2)
    expect(w.text()).toContain('Gestion Cours LMS')
    expect(w.text()).toContain('Quiz & Évaluations LMS')
    expect(w.text()).not.toContain('Activer/désactiver les visioconférences')
  })

  it('coordinateur : voit uniquement la carte Séances & Visio', () => {
    const w = mountIt({ isTeacher: false, isCoordinateur: true, isSuperAdmin: false })
    expect(w.findAll('.action-card')).toHaveLength(1)
    expect(w.text()).toContain('Gestion Séances & Visio')
    expect(w.find('.highlighted').exists()).toBe(true)
  })

  it('superAdmin : voit les 3 cartes', () => {
    const w = mountIt({ isTeacher: false, isCoordinateur: false, isSuperAdmin: true })
    expect(w.findAll('.action-card')).toHaveLength(3)
  })

  it('aucun rôle : aucune carte', () => {
    const w = mountIt({ isTeacher: false, isCoordinateur: false, isSuperAdmin: false })
    expect(w.findAll('.action-card')).toHaveLength(0)
  })
})
