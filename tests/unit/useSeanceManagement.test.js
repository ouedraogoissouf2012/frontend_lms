/**
 * Test du composable useSeanceManagement (#H6) : toggle visio (maj locale +
 * purge cache), ouverture modal participants, et routage des actions calendrier.
 * Composable de données useCoordinatorSeances réel mais services mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const toggleVisio = vi.fn()
const deleteSeance = vi.fn()
const routerPush = vi.fn()
const clearCache = vi.fn()
const toastError = vi.fn()
const storeJoinVisio = vi.fn()
const confirmVisioAction = vi.fn()

vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPush }) }))
vi.mock('@/services/lms', () => ({
  default: {
    toggleVisio: (...a) => toggleVisio(...a),
    deleteSeance: (...a) => deleteSeance(...a),
    getEnseignants: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getUpcomingSeances: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}))
vi.mock('@/services/klassci', () => ({
  klassciService: new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) })
}))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: vi.fn(), clearCache: (...a) => clearCache(...a) }))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { id: 1, role: 'coordinateur', name: 'Coord' } })
}))
vi.mock('@/stores/visio', () => ({
  useVisioStore: () => ({ joinVisio: (...a) => storeJoinVisio(...a) })
}))
vi.mock('@/composables/useToast', () => ({ toast: { success: vi.fn(), error: (...a) => toastError(...a), info: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
vi.mock('@/services/visioFeedback', () => ({ confirmVisioAction: (...a) => confirmVisioAction(...a) }))
vi.mock('@/constants/visio', () => ({
  VISIO_ROOM_REQUIRED_MESSAGE: 'Identifiant de salle visio introuvable dans la réponse API.',
  buildJitsiUrl: (r) => `jitsi://${r}`,
  getVisioRoomId: (source) => source?.visio_room_id || source?.room_id || source?.visio?.room_id || null,
  requireVisioRoomId: (source) => {
    const roomId = source?.visio_room_id || source?.room_id || source?.visio?.room_id
    if (!roomId) throw new Error('Identifiant de salle visio introuvable dans la réponse API.')
    return roomId
  }
}))

import { useSeanceManagement } from '@/composables/useSeanceManagement'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useSeanceManagement(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useSeanceManagement (#H6)', () => {
  beforeEach(() => {
    toggleVisio.mockReset()
    deleteSeance.mockReset()
    routerPush.mockReset()
    clearCache.mockReset()
    toastError.mockReset()
    storeJoinVisio.mockReset()
    storeJoinVisio.mockResolvedValue({ success: true })
    confirmVisioAction.mockReset()
    confirmVisioAction.mockResolvedValue(true)
  })

  it('toggleSeanceVisio active la visio localement et purge le cache', async () => {
    toggleVisio.mockResolvedValue({ success: true, message: 'ok', data: { visio_room_id: 'room-3-api' } })
    const u = await setup()
    const seance = { id: 3, visio_enabled: false }
    await u.toggleSeanceVisio(seance)
    expect(toggleVisio).toHaveBeenCalledWith(3, true, 'jitsi')
    expect(seance.visio_enabled).toBe(true)
    expect(seance.visio_room_id).toBe('room-3-api')
    expect(clearCache).toHaveBeenCalledWith('seances_management')
  })

  it('showParticipants ouvre la modal sur la bonne séance', async () => {
    const u = await setup()
    u.showParticipants({ id: 9 })
    expect(u.selectedSeanceId.value).toBe(9)
    expect(u.showParticipantsModal.value).toBe(true)
  })

  it('handleCalendarAction route viewDetails vers la séance', async () => {
    const u = await setup()
    await u.handleCalendarAction({ type: 'viewDetails', data: { id: 12 } })
    expect(routerPush).toHaveBeenCalledWith('/seances/12')
  })

  it('handleCalendarAction viewParticipants ouvre la modal', async () => {
    const u = await setup()
    await u.handleCalendarAction({ type: 'viewParticipants', data: { id: 5 } })
    expect(u.selectedSeanceId.value).toBe(5)
    expect(u.showParticipantsModal.value).toBe(true)
  })

  it('handleCalendarAction joinVisio sans room API n’ouvre pas Jitsi', async () => {
    const u = await setup()

    await u.handleCalendarAction({ type: 'joinVisio', data: { id: 5 } })

    expect(storeJoinVisio).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith('Identifiant de salle visio introuvable dans la réponse API.')
  })

  it('handleJoinVisio sans room API affiche le message explicite', async () => {
    const u = await setup()

    await u.handleJoinVisio({ id: 7 })

    expect(storeJoinVisio).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith('Identifiant de salle visio introuvable dans la réponse API.')
  })

  it('handleCalendarAction joinVisio passe par le store tracké', async () => {
    const u = await setup()

    await u.handleCalendarAction({ type: 'joinVisio', data: { id: 8, visio_room_id: 'room-8' } })

    expect(storeJoinVisio).toHaveBeenCalledWith(
      8,
      'jitsi://room-8',
    )
  })

  it('viewMode démarre en "list"', async () => {
    const u = await setup()
    expect(u.viewMode.value).toBe('list')
  })
})
