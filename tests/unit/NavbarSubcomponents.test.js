/**
 * Tests de montage des sous-composants présentationnels de la navbar (#H12) :
 * NavbarBreadcrumbs, NavbarNotifications, NavbarUserMenu. Aucun service : ils ne
 * reçoivent que des props et émettent des événements (parité de câblage).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

import NavbarBreadcrumbs from '@/components/layout/navbar/NavbarBreadcrumbs.vue'
import NavbarNotifications from '@/components/layout/navbar/NavbarNotifications.vue'
import NavbarUserMenu from '@/components/layout/navbar/NavbarUserMenu.vue'

const routerLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }

describe('NavbarBreadcrumbs', () => {
  it('affiche le titre et les liens du fil d\'Ariane', () => {
    const w = mount(NavbarBreadcrumbs, {
      props: {
        pageTitle: 'Leçons',
        breadcrumbs: [
          { label: 'Enseignant', to: '/teacher' },
          { label: 'Leçons', to: null }
        ]
      },
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    expect(w.find('.page-title').text()).toBe('Leçons')
    expect(w.findAll('.breadcrumb-link').map(a => a.attributes('href'))).toEqual(['/teacher'])
    expect(w.find('.breadcrumb-text').text()).toBe('Leçons')
  })
})

describe('NavbarNotifications', () => {
  it('affiche le badge et émet toggle au clic sur la cloche', async () => {
    const w = mount(NavbarNotifications, {
      props: { notifications: [], unreadCount: 5, show: false }
    })
    expect(w.find('.badge').text()).toBe('5')
    await w.find('.icon-btn').trigger('click')
    expect(w.emitted('toggle')).toBeTruthy()
  })

  it('rend l\'état vide quand show=true et liste vide', () => {
    const w = mount(NavbarNotifications, {
      props: { notifications: [], unreadCount: 0, show: true }
    })
    expect(w.find('.notifications-panel').exists()).toBe(true)
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('émet select au clic sur une notification', async () => {
    const w = mount(NavbarNotifications, {
      props: {
        show: true,
        unreadCount: 1,
        notifications: [{ id: 1, title: 'T', message: 'M', is_unread: true, time_ago: '1h' }]
      }
    })
    await w.find('.notification-item').trigger('click')
    expect(w.emitted('select')).toBeTruthy()
  })
})

describe('NavbarUserMenu', () => {
  it('affiche les initiales et émet toggle au clic', async () => {
    const w = mount(NavbarUserMenu, {
      props: { userInitials: 'JD', show: false, profileUrl: '/teacher/profile', settingsUrl: '/teacher/settings' },
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    expect(w.find('.user-avatar').text()).toBe('JD')
    await w.find('.user-menu').trigger('click')
    expect(w.emitted('toggle')).toBeTruthy()
  })

  it('rend le dropdown avec les bonnes URLs et émet logout', async () => {
    const w = mount(NavbarUserMenu, {
      props: { userInitials: 'JD', show: true, profileUrl: '/teacher/profile', settingsUrl: '/teacher/settings' },
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    const hrefs = w.findAll('a.dropdown-item').map(a => a.attributes('href'))
    expect(hrefs).toEqual(['/teacher/profile', '/teacher/settings'])
    await w.find('button.dropdown-item').trigger('click')
    expect(w.emitted('logout')).toBeTruthy()
  })
})
