/**
 * Test du composable useNotificationsWidget (H8 ≤300) : chargement au montage,
 * marquage lu (local + compteur), suppression. Service + router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getRecentNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } = vi.hoisted(() => ({
  getRecentNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn()
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/notifications', () => ({
  notificationsService: { getRecentNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification }
}))

import { useNotificationsWidget } from '@/composables/useNotificationsWidget'

function sample() {
  return [
    { id: 1, is_unread: true, time_ago: 'now', data: { type: 'info', icon: 'BellIcon', title: 'A', message: 'a' } },
    { id: 2, is_unread: false, time_ago: '1h', data: { type: 'success', icon: 'CheckCircleIcon', title: 'B', message: 'b' } }
  ]
}

async function setup(props = {}) {
  let api
  const emitted = []
  const Comp = defineComponent({
    emits: ['notification-read', 'notification-deleted', 'notification-click'],
    setup(_, { emit }) {
      api = useNotificationsWidget(
        { limit: 5, autoRefresh: false, refreshInterval: 60000, ...props },
        (e, p) => { emitted.push([e, p]); emit(e, p) }
      )
      return () => null
    }
  })
  mount(Comp)
  await flushPromises()
  return { api, emitted }
}

describe('useNotificationsWidget (H8)', () => {
  beforeEach(() => {
    getRecentNotifications.mockResolvedValue(sample())
    getUnreadCount.mockResolvedValue(1)
    markAsRead.mockResolvedValue(true)
    markAllAsRead.mockResolvedValue(true)
    deleteNotification.mockResolvedValue(true)
  })

  it('charge les notifications au montage avec la limite fournie', async () => {
    const { api } = await setup({ limit: 5 })
    expect(getRecentNotifications).toHaveBeenCalledWith(5)
    expect(getUnreadCount).toHaveBeenCalled()
    expect(api.notifications.value).toHaveLength(2)
    expect(api.unreadCount.value).toBe(1)
    expect(api.loading.value).toBe(false)
  })

  it('marque une notification comme lue (local + compteur + emit)', async () => {
    const { api, emitted } = await setup()
    await api.handleMarkAsRead(1)
    expect(markAsRead).toHaveBeenCalledWith(1)
    expect(api.notifications.value.find(n => n.id === 1).is_unread).toBe(false)
    expect(api.unreadCount.value).toBe(0)
    expect(emitted).toContainEqual(['notification-read', 1])
  })

  it('supprime une notification et décrémente le compteur si elle était non-lue', async () => {
    const { api, emitted } = await setup()
    await api.handleDelete(1)
    expect(deleteNotification).toHaveBeenCalledWith(1)
    expect(api.notifications.value).toHaveLength(1)
    expect(api.unreadCount.value).toBe(0)
    expect(emitted).toContainEqual(['notification-deleted', 1])
  })

  it('marque tout comme lu', async () => {
    const { api, emitted } = await setup()
    await api.handleMarkAllAsRead()
    expect(markAllAsRead).toHaveBeenCalled()
    expect(api.notifications.value.every(n => !n.is_unread)).toBe(true)
    expect(api.unreadCount.value).toBe(0)
    expect(emitted).toContainEqual(['notification-read', 'all'])
  })
})
