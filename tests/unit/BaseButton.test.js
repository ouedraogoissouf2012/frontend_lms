/**
 * Tests du composant BaseButton (#25) — src/components/ui/BaseButton.vue
 * Variantes, états loading/disabled, type explicite, slots label/icon, $attrs.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import BaseButton from '@/components/ui/BaseButton.vue'

describe('ui/BaseButton (#25)', () => {
  it('rend le label via slot par défaut', () => {
    const w = mount(BaseButton, { slots: { default: 'Enregistrer' } })
    expect(w.find('.base-btn__label').text()).toBe('Enregistrer')
  })

  it('variant primary par défaut', () => {
    const w = mount(BaseButton, { slots: { default: 'X' } })
    expect(w.find('button').classes()).toContain('base-btn--primary')
  })

  it('variant danger appliquée', () => {
    const w = mount(BaseButton, { props: { variant: 'danger' }, slots: { default: 'X' } })
    expect(w.find('button').classes()).toContain('base-btn--danger')
  })

  it('type button par défaut, submit respecté', () => {
    expect(mount(BaseButton, { slots: { default: 'X' } }).find('button').attributes('type')).toBe('button')
    const w = mount(BaseButton, { props: { type: 'submit' }, slots: { default: 'X' } })
    expect(w.find('button').attributes('type')).toBe('submit')
  })

  it('loading : spinner affiché, bouton désactivé, classe is-loading', () => {
    const w = mount(BaseButton, { props: { loading: true }, slots: { default: 'X' } })
    expect(w.find('.base-btn__spinner').exists()).toBe(true)
    expect(w.find('button').attributes('disabled')).toBeDefined()
    expect(w.find('button').classes()).toContain('is-loading')
  })

  it('disabled : bouton désactivé', () => {
    const w = mount(BaseButton, { props: { disabled: true }, slots: { default: 'X' } })
    expect(w.find('button').attributes('disabled')).toBeDefined()
  })

  it('slot icon rendu quand pas en loading', () => {
    const w = mount(BaseButton, { slots: { default: 'X', icon: '<svg class="ic"></svg>' } })
    expect(w.find('.base-btn__icon .ic').exists()).toBe(true)
  })

  it('clic émis quand actif, bloqué quand disabled', async () => {
    const actif = mount(BaseButton, { slots: { default: 'X' } })
    await actif.find('button').trigger('click')
    expect(actif.emitted('click')).toBeTruthy()

    const inactif = mount(BaseButton, { props: { disabled: true }, slots: { default: 'X' } })
    await inactif.find('button').trigger('click')
    expect(inactif.emitted('click')).toBeFalsy()
  })

  it('$attrs : data-testid traverse vers le <button>', () => {
    const w = mount(BaseButton, { attrs: { 'data-testid': 'save' }, slots: { default: 'X' } })
    expect(w.find('button').attributes('data-testid')).toBe('save')
  })
})
