/**
 * Test de useNotifications : DÉDUPLICATION des chargements concurrents et respect
 * de l'option `autoCheck`.
 *
 * Défaut constaté en navigation réelle : trois `GET /notifications/recent?limit=10`
 * identiques partaient au montage d'une seule page. Deux causes cumulées —
 *
 *  1. Contrat d'option violé : `useNavbar` appelait `useNotifications(false)`, un
 *     BOOLÉEN, alors que la signature attend un objet. `const { autoCheck = true }
 *     = false` boxe le primitif → `autoCheck` vaut `undefined` → le défaut `true`
 *     s'applique. L'intention « pas d'auto-check » était silencieusement inversée.
 *
 *  2. TOCTOU sur le garde-fou anti-remontage : `lastCheckTime` n'est écrit qu'APRÈS
 *     l'await de la requête. Les instances montées dans le même tick lisent toutes
 *     `null` et déclenchent toutes leur propre appel.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockService = vi.hoisted(() => ({
  getRecentNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  getUnreadCount: vi.fn(),
}))

vi.mock('@/services/notifications', () => ({
  notificationsService: mockService,
  default: mockService,
}))

import { useNotifications, __resetNotificationsPollingState } from '@/composables/useNotifications'

/** Monte N composants partageant le composable, dans le même tick. */
function mountMany(count, options) {
  const Comp = defineComponent({
    setup() { useNotifications(options); return () => null },
  })
  return Array.from({ length: count }, () => mount(Comp))
}

beforeEach(() => {
  vi.useRealTimers()
  mockService.getRecentNotifications.mockReset().mockResolvedValue([])
  __resetNotificationsPollingState()
})

describe('useNotifications — déduplication au montage', () => {
  it('ne lance QU’UN appel réseau quand plusieurs instances montent ensemble', async () => {
    mountMany(3, { autoCheck: true })
    await flushPromises()

    // Avant correctif : 3 appels identiques (TOCTOU sur lastCheckTime).
    expect(mockService.getRecentNotifications).toHaveBeenCalledTimes(1)
  })

  it('dédoublonne aussi un mélange autoCheck / sans autoCheck', async () => {
    mountMany(1, { autoCheck: true })
    mountMany(1, { autoCheck: false })
    await flushPromises()

    expect(mockService.getRecentNotifications).toHaveBeenCalledTimes(1)
  })

  it('partage le résultat entre toutes les instances', async () => {
    mockService.getRecentNotifications.mockResolvedValue([
      { id: 1, is_unread: true }, { id: 2, is_unread: false },
    ])

    let a, b
    const A = defineComponent({ setup() { a = useNotifications({ autoCheck: false }); return () => null } })
    const B = defineComponent({ setup() { b = useNotifications({ autoCheck: false }); return () => null } })
    mount(A); mount(B)
    await flushPromises()

    expect(a.unreadCount.value).toBe(1)
    expect(b.unreadCount.value).toBe(1)
  })
})

describe('useNotifications — contrat de l’option autoCheck', () => {
  it('n’installe PAS de polling quand autoCheck vaut false', async () => {
    vi.useFakeTimers()
    mountMany(1, { autoCheck: false })
    await vi.advanceTimersByTimeAsync(0)
    mockService.getRecentNotifications.mockClear()

    // Bien au-delà de l'intervalle par défaut (2 min) : aucun appel de plus.
    await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    expect(mockService.getRecentNotifications).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('rejette un argument non-objet plutôt que d’inverser silencieusement l’intention', () => {
    // `useNotifications(false)` était accepté et interprété comme autoCheck:true.
    expect(() => useNotifications(false)).toThrow(/objet/i)
    expect(() => useNotifications(true)).toThrow(/objet/i)
  })
})
