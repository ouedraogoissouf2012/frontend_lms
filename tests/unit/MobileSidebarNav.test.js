/**
 * Test de montage de MobileSidebarNav (#H12). Présentationnel : props in,
 * events out. Vérifie le rendu des sections, le marquage actif et les emits.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

import MobileSidebarNav from '@/components/layout/mobile/MobileSidebarNav.vue'

const routerLinkStub = { props: ['to'], template: '<a :href="to"><slot /></a>' }

function mountNav(extra = {}) {
  return mount(MobileSidebarNav, {
    props: {
      secondaryNavItems: [
        { path: '/teacher/seances', icon: 'fa-video-camera', label: 'Mes Séances Visio', badge: null },
        { path: '/forum', icon: 'fa-comments', label: 'Forum', badge: null }
      ],
      adminNavItems: [],
      activePath: '/teacher/seances',
      ...extra
    },
    global: { stubs: { RouterLink: routerLinkStub } }
  })
}

describe('MobileSidebarNav (#H12)', () => {
  it('rend les liens secondaires et marque le chemin actif', () => {
    const w = mountNav()
    const links = w.findAll('a.nav-link')
    expect(links.map(a => a.attributes('href'))).toEqual(['/teacher/seances', '/forum'])
    // le 1er lien correspond au activePath → classe active
    expect(links[0].classes()).toContain('active')
    expect(links[1].classes()).not.toContain('active')
  })

  it('masque la section Administration si vide, l\'affiche sinon', () => {
    expect(mountNav().findAll('.section-title').map(h => h.text()))
      .toEqual(['Navigation', 'Compte'])

    const w = mountNav({
      adminNavItems: [{ path: '/admin/classes', icon: 'fa-building', label: 'Classes', badge: null }]
    })
    expect(w.findAll('.section-title').map(h => h.text()))
      .toEqual(['Navigation', 'Administration', 'Compte'])
  })

  it('émet close au clic sur un lien et logout au clic sur Déconnexion', async () => {
    const w = mountNav()
    await w.find('a.nav-link').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
    await w.find('button.logout-link').trigger('click')
    expect(w.emitted('logout')).toBeTruthy()
  })
})
