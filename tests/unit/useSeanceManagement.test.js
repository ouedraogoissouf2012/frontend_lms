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

vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPush }) }))
vi.mock('@/services/lms', () => ({
  default: {
    toggleVisio: (...a) => toggleVisio(...a),
    deleteSeance: (...a) => deleteSeance(...a)
  }
}))
vi.mock('@/services/klassci', () => ({
  klassciService: new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) })
}))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: vi.fn(), clearCache: (...a) => clearCache(...a) }))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { id: 1, role: 'coordinateur', name: 'Coord' } })
}))
vi.mock('@/services/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
vi.mock('@/constants/visio', () => ({ buildJitsiUrl: (r) => `jitsi://${r}` }))
vi.mock('@/composables/useVisioParticipation', () => ({
  useVisioParticipation: () => ({ joinVisio: vi.fn(), leaveVisio: vi.fn() })
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
  })

  it('toggleSeanceVisio active la visio localement et purge le cache', async () => {
    toggleVisio.mockResolvedValue({ success: true, message: 'ok' })
    const u = await setup()
    const seance = { id: 3, visio_enabled: false }
    await u.toggleSeanceVisio(seance)
    expect(toggleVisio).toHaveBeenCalledWith(3, true, 'jitsi')
    expect(seance.visio_enabled).toBe(true)
    expect(seance.visio_room_id).toBe('seance_3')
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

  it('viewMode démarre en "list"', async () => {
    const u = await setup()
    expect(u.viewMode.value).toBe('list')
  })
})
