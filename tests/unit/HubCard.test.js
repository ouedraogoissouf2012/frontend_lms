/**
 * Test de rendu HubCard (#G1 ≤300) : affichage du titre/description/compteur,
 * application de la classe d'icône, rendu de l'icône fournie et lien `to`.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import HubCard from '@/components/admin/HubCard.vue'

const FakeIcon = { name: 'FakeIcon', render: () => h('svg', { class: 'fake-icon' }) }

const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  render() { return h('a', { href: this.to }, this.$slots.default?.()) },
}

function mountCard(props = {}) {
  return mount(HubCard, {
    props: {
      to: '/admin/classes',
      icon: FakeIcon,
      iconClass: 'classes-icon',
      title: 'Classes',
      description: 'Gérer les classes et leurs étudiants',
      stat: 7,
      statLabel: 'classe(s)',
      footerText: 'Voir les classes',
      ...props,
    },
    global: { stubs: { 'router-link': RouterLinkStub } },
  })
}

describe('HubCard (#G1)', () => {
  it('affiche titre, description, compteur et libellés', () => {
    const w = mountCard()
    expect(w.find('.card-title').text()).toBe('Classes')
    expect(w.find('.card-description').text()).toBe('Gérer les classes et leurs étudiants')
    expect(w.find('.stat-number').text()).toBe('7')
    expect(w.find('.stat-label').text()).toBe('classe(s)')
    expect(w.find('.card-footer span').text()).toBe('Voir les classes')
  })

  it('applique la classe d\'icône et rend l\'icône fournie', () => {
    const w = mountCard()
    expect(w.find('.card-icon').classes()).toContain('classes-icon')
    expect(w.find('.fake-icon').exists()).toBe(true)
  })

  it('passe la route au lien', () => {
    const w = mountCard({ to: '/admin/matieres' })
    expect(w.find('a').attributes('href')).toBe('/admin/matieres')
  })
})
