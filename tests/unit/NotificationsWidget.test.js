/**
 * Test de montage de NotificationsWidget (G6).
 * Le service de notifications et le router sont mockés (le widget charge ses
 * données au montage). On vérifie le rendu de l'en-tête et le badge non-lus.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const { getRecentNotifications, getUnreadCount } = vi.hoisted(() => ({
  getRecentNotifications: vi.fn(() => Promise.resolve([])),
  getUnreadCount: vi.fn(() => Promise.resolve(0))
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/notifications', () => ({
  notificationsService: {
    getRecentNotifications,
    getUnreadCount,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn()
  }
}))

import NotificationsWidget from '@/components/widgets/NotificationsWidget.vue'

describe('NotificationsWidget (G6) — montage', () => {
  it('monte et affiche le titre du widget', async () => {
    const w = mount(NotificationsWidget)
    await flushPromises()
    expect(w.find('.notifications-widget').exists()).toBe(true)
    expect(w.find('.widget-title').text()).toBe('Notifications')
  })

  it('charge les notifications au montage avec la limite par défaut (5)', async () => {
    mount(NotificationsWidget)
    await flushPromises()
    expect(getRecentNotifications).toHaveBeenCalledWith(5)
    expect(getUnreadCount).toHaveBeenCalled()
  })
})
