/**
 * Tests de montage des panneaux du header mobile (#H12) :
 * MobileNotificationsPanel et MobileUserMenuPanel. Présentationnels : visibles
 * selon `show`, émettent close/logout.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

import MobileNotificationsPanel from '@/components/layout/mobile/MobileNotificationsPanel.vue'
import MobileUserMenuPanel from '@/components/layout/mobile/MobileUserMenuPanel.vue'

const routerLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }

describe('MobileNotificationsPanel', () => {
  it('caché quand show=false', () => {
    const w = mount(MobileNotificationsPanel, { props: { show: false } })
    expect(w.find('.notifications-panel').exists()).toBe(false)
  })

  it('visible quand show=true et émet close', async () => {
    const w = mount(MobileNotificationsPanel, { props: { show: true } })
    expect(w.find('.notifications-panel').exists()).toBe(true)
    expect(w.find('.empty-message').exists()).toBe(true)
    await w.find('.close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})

describe('MobileUserMenuPanel', () => {
  const props = {
    show: true,
    userInitials: 'JD',
    userName: 'Jane Doe',
    userRoleLabel: 'Enseignant',
    profilePath: '/teacher/profile'
  }

  it('affiche infos user + liens et émet close/logout', async () => {
    const w = mount(MobileUserMenuPanel, {
      props,
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    expect(w.find('.user-avatar-large').text()).toBe('JD')
    expect(w.find('.user-name').text()).toBe('Jane Doe')
    expect(w.find('.user-role').text()).toBe('Enseignant')

    const hrefs = w.findAll('a.menu-item').map(a => a.attributes('href'))
    expect(hrefs).toEqual(['/teacher/profile', '/settings'])

    await w.find('.close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()

    await w.find('button.logout-item').trigger('click')
    expect(w.emitted('logout')).toBeTruthy()
  })

  it('caché quand show=false', () => {
    const w = mount(MobileUserMenuPanel, {
      props: { ...props, show: false },
      global: { stubs: { RouterLink: routerLinkStub } }
    })
    expect(w.find('.user-menu-panel').exists()).toBe(false)
  })
})
