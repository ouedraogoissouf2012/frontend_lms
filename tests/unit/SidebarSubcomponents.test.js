/**
 * Tests de montage des sous-composants présentationnels de la sidebar (#H12) :
 * SidebarHeader, SidebarNav, SidebarUserProfile. Aucun service : props in,
 * events out (parité de câblage avec useSidebar).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

import SidebarHeader from '@/components/layout/sidebar/SidebarHeader.vue'
import SidebarNav from '@/components/layout/sidebar/SidebarNav.vue'
import SidebarUserProfile from '@/components/layout/sidebar/SidebarUserProfile.vue'

const routerLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }

describe('SidebarHeader', () => {
  it('affiche le logo (déplié) et émet toggle au clic', async () => {
    const w = mount(SidebarHeader, { props: { isCollapsed: false } })
    expect(w.find('.logo-text').exists()).toBe(true)
    await w.find('.sidebar-header').trigger('click')
    expect(w.emitted('toggle')).toBeTruthy()
  })

  it('masque le label du logo quand replié', () => {
    const w = mount(SidebarHeader, { props: { isCollapsed: true } })
    expect(w.find('.logo-text').exists()).toBe(false)
  })
})

describe('SidebarNav', () => {
  const sections = [
    { to: '/teacher/dashboard', icon: 'fa-home', label: 'Accueil' },
    {
      icon: 'fa-book', label: 'Pédagogie',
      children: [
        { to: '/teacher/lessons', icon: 'fa-file', label: 'Leçons' },
        { to: '/teacher/evaluations', icon: 'fa-check', label: 'Évaluations' }
      ]
    }
  ]

  it('rend les items simples et émet toggle-submenu sur un parent', async () => {
    const w = mount(SidebarNav, {
      props: { menuSections: sections, isCollapsed: false, openSubmenus: {} },
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    const hrefs = w.findAll('a.nav-item').map(a => a.attributes('href'))
    expect(hrefs).toEqual(['/teacher/dashboard'])
    await w.find('.parent-item').trigger('click')
    expect(w.emitted('toggle-submenu')[0]).toEqual([1])
  })

  it('affiche le sous-menu quand ouvert et non replié', () => {
    const w = mount(SidebarNav, {
      props: { menuSections: sections, isCollapsed: false, openSubmenus: { 1: true } },
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    const subHrefs = w.findAll('a.nav-sub-item').map(a => a.attributes('href'))
    expect(subHrefs).toEqual(['/teacher/lessons', '/teacher/evaluations'])
  })
})

describe('SidebarUserProfile', () => {
  it('affiche initiales/nom/rôle et émet go-to-profile', async () => {
    const w = mount(SidebarUserProfile, {
      props: { userInitials: 'JD', userName: 'Doe Jane', userRole: 'Étudiant', isCollapsed: false }
    })
    expect(w.find('.avatar').text()).toBe('JD')
    expect(w.find('.user-name').text()).toBe('Doe Jane')
    expect(w.find('.user-role').text()).toBe('Étudiant')
    await w.find('.user-profile').trigger('click')
    expect(w.emitted('go-to-profile')).toBeTruthy()
  })

  it('masque les infos quand replié', () => {
    const w = mount(SidebarUserProfile, {
      props: { userInitials: 'JD', userName: 'Doe Jane', userRole: 'Étudiant', isCollapsed: true }
    })
    expect(w.find('.user-info').exists()).toBe(false)
  })
})
