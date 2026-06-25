/**
 * Test de rendu/émissions de NotificationItem (H8 ≤300) : sous-composant
 * présentationnel. Vérifie titre/message, classe de type, et émissions
 * (click / mark-read / delete).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import NotificationItem from '@/components/widgets/NotificationItem.vue'

function mountItem(overrides = {}) {
  const notification = {
    id: 7,
    is_unread: true,
    time_ago: 'il y a 5 min',
    data: { type: 'warning', icon: 'ExclamationCircleIcon', title: 'Titre', message: 'Message', ...(overrides.data || {}) },
    ...overrides
  }
  return mount(NotificationItem, { props: { notification } })
}

describe('NotificationItem (H8)', () => {
  it('affiche titre, message et temps', () => {
    const w = mountItem()
    expect(w.find('.notification-title').text()).toBe('Titre')
    expect(w.find('.notification-message').text()).toBe('Message')
    expect(w.find('.notification-time').text()).toBe('il y a 5 min')
  })

  it('applique la classe de type (warning)', () => {
    const w = mountItem()
    expect(w.find('.notification-icon').classes()).toContain('type-warning')
  })

  it('émet `click` avec la notification', async () => {
    const w = mountItem()
    await w.find('.notification-item').trigger('click')
    expect(w.emitted('click')[0][0].id).toBe(7)
  })

  it('émet `mark-read` (id) si non-lue, et `delete` (id)', async () => {
    const w = mountItem()
    await w.find('.mark-read-btn').trigger('click')
    expect(w.emitted('mark-read')[0]).toEqual([7])
    await w.find('.delete-btn').trigger('click')
    expect(w.emitted('delete')[0]).toEqual([7])
  })

  it("n'affiche pas le bouton mark-read si déjà lue", () => {
    const w = mountItem({ is_unread: false })
    expect(w.find('.mark-read-btn').exists()).toBe(false)
  })
})
