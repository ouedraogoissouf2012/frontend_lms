/**
 * Test du composable useTeacherSeances (#H6) : chargement (cache/API), filtres,
 * statistiques et actions visio (activation invalide le cache + recharge).
 * Services, store, cache et logique pure mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getMyTeachingSeances = vi.fn()
const activateVisio = vi.fn()
const getTeacherDashboard = vi.fn()

vi.mock('@/services/lms', () => ({
  lmsService: {
    getMyTeachingSeances: (...a) => getMyTeachingSeances(...a),
    activateVisio: (...a) => activateVisio(...a),
    deactivateVisio: vi.fn(), startVisio: vi.fn(), endVisio: vi.fn()
  }
}))
vi.mock('@/services/klassci', () => ({
  klassciService: { getTeacherDashboard: (...a) => getTeacherDashboard(...a) }
}))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { id: 1, role: 'enseignant', name: 'X' } })
}))
vi.mock('@/services/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))
const clearCache = vi.fn()
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: vi.fn(), clearCache: (...a) => clearCache(...a) }))
vi.mock('@/constants/visio', () => ({ buildJitsiUrl: (r) => `jitsi://${r}` }))
vi.mock('@/composables/useVisioParticipation', () => ({
  useVisioParticipation: () => ({ joinVisio: vi.fn(), leaveVisio: vi.fn() })
}))

import { useTeacherSeances } from '@/composables/useTeacherSeances'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherSeances(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

const sampleSeances = [
  { id: 1, visio: { enabled: true, status: 'active' } },
  { id: 2, visio: null },
  { id: 3, visio: { enabled: true, status: 'terminee' } }
]

describe('useTeacherSeances (#H6)', () => {
  beforeEach(() => {
    getMyTeachingSeances.mockReset()
    activateVisio.mockReset()
    getTeacherDashboard.mockReset()
    clearCache.mockReset()
    getTeacherDashboard.mockResolvedValue({ matieres: [{ id: 9, nom: 'Maths' }] })
  })

  it('charge les séances depuis l\'API et calcule les stats', async () => {
    getMyTeachingSeances.mockResolvedValue({ data: sampleSeances })
    const u = await setup()
    expect(u.seances.value).toHaveLength(3)
    expect(u.loading.value).toBe(false)
    expect(u.stats.value.total).toBe(3)
    expect(u.matieres.value).toEqual([{ id: 9, nom: 'Maths' }])
  })

  it('filtre par statut visio via filters.visio_status', async () => {
    getMyTeachingSeances.mockResolvedValue({ data: sampleSeances })
    const u = await setup()
    u.filters.visio_status = 'active'
    expect(u.filteredSeances.value).toHaveLength(1)
    expect(u.filteredSeances.value[0].id).toBe(1)
  })

  it('resetFilters remet les valeurs par défaut', async () => {
    getMyTeachingSeances.mockResolvedValue({ data: [] })
    const u = await setup()
    u.filters.matiere_id = '9'; u.filters.visio_status = 'active'; u.filters.period = 'week'
    u.resetFilters()
    expect(u.filters).toEqual({ matiere_id: '', visio_status: '', period: 'all' })
  })

  it('handleActivateVisio invalide le cache et recharge', async () => {
    getMyTeachingSeances.mockResolvedValue({ data: [] })
    activateVisio.mockResolvedValue({ success: true })
    const u = await setup()
    await u.handleActivateVisio({ id: 5 })
    expect(activateVisio).toHaveBeenCalledWith(5)
    expect(clearCache).toHaveBeenCalledWith('teacher_seances')
    expect(u.actionLoading.value).toBe(null)
  })
})
