/**
 * Badge de notifications : le compte RÉEL du serveur, et jamais un 0 fabriqué.
 *
 * Le badge comptait les non-lues de `GET /notifications/recent`, que le serveur
 * borne à 10 éléments (non-lues seulement) : avec 15 non-lues, il affichait 10.
 * Le serveur expose le compte réel (`GET /notifications/unread-count`, forme
 * `{ success: true, count }`, `count` à la racine). Et le service rendait `[]` ou
 * `0` sur toute panne : la liste se vidait, le badge tombait à 0 et le frein de
 * scrutation (arrêt après 3 échecs) ne voyait jamais d'échec.
 *
 * Tout passe par le VRAI service, avec un `api` simulé par URL.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const reponses = vi.hoisted(() => ({ recent: null, compte: null }))
const getMock = vi.hoisted(() => vi.fn())
vi.mock('@/services/api', () => ({
  default: { get: (...a) => getMock(...a), post: vi.fn(), delete: vi.fn() },
}))
vi.mock('@/composables/useToast', () => ({ useToast: () => ({ show: vi.fn() }), toast: { show: vi.fn() } }))

import { notificationsService } from '@/services/notifications'
import { useNotifications, __resetNotificationsPollingState } from '@/composables/useNotifications'
import NavbarNotifications from '@/components/layout/navbar/NavbarNotifications.vue'

const panne = () => Object.assign(new Error('HTTP 503'), { isAxiosError: true, response: { status: 503, data: {} } })
const nonLues = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, is_unread: true, title: `t${i}`, message: 'm', created_at: '2026-10-29T00:00:00Z' }))

function repondre() {
  getMock.mockImplementation((url) => {
    const r = url.endsWith('/notifications/unread-count') ? reponses.compte : reponses.recent
    return typeof r === 'function' ? r() : Promise.resolve(r)
  })
}

function monter(options = { autoCheck: false }) {
  let api
  mount(defineComponent({ setup() { api = useNotifications(options); return () => null } }))
  return api
}

beforeEach(() => {
  vi.useRealTimers()
  getMock.mockReset()
  reponses.recent = { success: true, data: [] }
  reponses.compte = { success: true, count: 0 }
  repondre()
  __resetNotificationsPollingState()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('notificationsService — un refus ou une panne est un ÉCHEC, jamais un vide', () => {
  it.each([
    ['success faux', () => Promise.resolve({ success: false })],
    ['data absente', () => Promise.resolve({ success: true })],
    ['panne HTTP', () => Promise.reject(panne())],
  ])('getRecentNotifications rejette (%s)', async (_nom, r) => {
    reponses.recent = r
    await expect(notificationsService.getRecentNotifications(10)).rejects.toBeInstanceOf(Error)
  })

  it.each([
    ['success faux', () => Promise.resolve({ success: false })],
    ['compte absent', () => Promise.resolve({ success: true })],
    ['compte négatif', () => Promise.resolve({ success: true, count: -1 })],
    ['panne HTTP', () => Promise.reject(panne())],
  ])('getUnreadCount rejette (%s)', async (_nom, r) => {
    reponses.compte = r
    await expect(notificationsService.getUnreadCount()).rejects.toBeInstanceOf(Error)
  })

  it('une enveloppe refusée porte le message du catalogue', async () => {
    reponses.compte = { success: false }
    const echec = await notificationsService.getUnreadCount().catch((e) => e)
    expect(echec.userMessage).toBe(ERROR_MESSAGES.unknown)
  })

  it('rend le compte et la liste quand les réponses sont conformes', async () => {
    reponses.compte = { success: true, count: 15 }
    reponses.recent = { success: true, data: nonLues(2) }
    await expect(notificationsService.getUnreadCount()).resolves.toBe(15)
    await expect(notificationsService.getRecentNotifications(10)).resolves.toHaveLength(2)
  })
})

describe('useNotifications — le badge', () => {
  it('affiche le compte RÉEL du serveur, pas les non-lues des 10 récentes', async () => {
    reponses.compte = { success: true, count: 15 }
    reponses.recent = { success: true, data: nonLues(10) }
    const n = monter()
    await flushPromises()
    expect(n.unreadCount.value).toBe(15)
    expect(n.notifications.value).toHaveLength(10)
  })

  it('au chargement du module, avant toute mesure, le compte vaut null', async () => {
    // Module NEUF : la remise à zéro des tests ne doit pas masquer la valeur initiale.
    vi.resetModules()
    const { useNotifications: neuf } = await import('@/composables/useNotifications')
    let n
    mount(defineComponent({ setup() { n = neuf({ autoCheck: false }); return () => null } }))
    expect(n.unreadCount.value).toBeNull()
    await flushPromises()
  })

  it('jamais mesuré : null, et non 0', async () => {
    reponses.compte = () => Promise.reject(panne())
    const n = monter()
    await flushPromises()
    expect(n.unreadCount.value).toBeNull()
  })

  it('un 0 RÉEL du serveur reste 0, distinct du « non mesuré »', async () => {
    reponses.compte = { success: true, count: 0 }
    const n = monter()
    await flushPromises()
    expect(n.unreadCount.value).toBe(0)
  })

  it('une panne après une mesure GARDE la dernière valeur, liste comprise', async () => {
    reponses.compte = { success: true, count: 4 }
    reponses.recent = { success: true, data: nonLues(4) }
    const n = monter()
    await flushPromises()
    reponses.compte = () => Promise.reject(panne())
    reponses.recent = () => Promise.reject(panne())
    await n.checkNewNotifications()
    expect(n.unreadCount.value).toBe(4)
    expect(n.notifications.value).toHaveLength(4)
  })

  it('marquer lu ne transforme pas un compte non mesuré en nombre', async () => {
    reponses.compte = () => Promise.reject(panne())
    const n = monter()
    await flushPromises()
    const espion = vi.spyOn(notificationsService, 'markAsRead').mockResolvedValue(true)
    await n.markAsRead(1)
    espion.mockRestore()
    expect(n.unreadCount.value).toBeNull()
  })
})

describe('useNotifications — le frein de scrutation', () => {
  it('3 échecs de suite arrêtent la scrutation', async () => {
    vi.useFakeTimers()
    reponses.compte = () => Promise.reject(panne())
    reponses.recent = () => Promise.reject(panne())
    monter({ autoCheck: true, checkIntervalMs: 1000, showToast: false })
    await vi.advanceTimersByTimeAsync(0)
    for (let i = 0; i < 3; i++) await vi.advanceTimersByTimeAsync(1000)
    const appelsApresTroisEchecs = getMock.mock.calls.length
    await vi.advanceTimersByTimeAsync(5000)
    expect(getMock.mock.calls.length).toBe(appelsApresTroisEchecs)
  })
})

describe('NavbarNotifications — le badge à l écran', () => {
  const rendre = (unreadCount) => mount(NavbarNotifications, {
    props: { unreadCount, notifications: [], show: false },
    global: { stubs: { RouterLink: true } },
  })

  it('un compte non mesuré (null) n affiche aucun badge', () => {
    expect(rendre(null).find('.badge').exists()).toBe(false)
  })

  it('un 0 réel n affiche aucun badge', () => {
    expect(rendre(0).find('.badge').exists()).toBe(false)
  })

  it('un compte positif s affiche', () => {
    expect(rendre(15).find('.badge').text()).toBe('15')
  })
})
