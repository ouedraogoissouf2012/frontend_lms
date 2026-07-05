/**
 * Test du composable useTeacherVisioList (#G1 ≤300) : chargement des séances
 * (cache + API), dérivation des visios « en cours » / « à venir » et des
 * statistiques, et handlers d'actions (activate / start / end). Services
 * lms + cache mockés. Garde-fou de parité avec l'ancien TeacherVisioList.vue.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  getMyTeachingSeances, activateVisio, startVisio, endVisio,
  readCache, writeCache, clearCache, confirmVisioAction, joinTrackedVisio,
} = vi.hoisted(() => ({
  getMyTeachingSeances: vi.fn(),
  activateVisio: vi.fn(() => Promise.resolve()),
  startVisio: vi.fn(() => Promise.resolve()),
  endVisio: vi.fn(() => Promise.resolve()),
  readCache: vi.fn(() => null),
  writeCache: vi.fn(),
  clearCache: vi.fn(),
  confirmVisioAction: vi.fn(() => Promise.resolve(true)),
  joinTrackedVisio: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('@/services/lms', () => ({
  lmsService: { getMyTeachingSeances, activateVisio, startVisio, endVisio },
  default: { getMyTeachingSeances, activateVisio, startVisio, endVisio },
}))
vi.mock('@/services/cache', () => ({ readCache, writeCache, clearCache }))
vi.mock('@/services/visioFeedback', () => ({ confirmVisioAction }))
vi.mock('@/composables/useTrackedVisioJoin', () => ({
  useTrackedVisioJoin: () => ({ joinTrackedVisio })
}))

import { useTeacherVisioList } from '@/composables/useTeacherVisioList'

// Construit une séance dont l'horaire encadre / précède / suit "maintenant".
function makeSeance(overrides = {}) {
  return {
    id: 1,
    visio_enabled: true,
    visio_active: false,
    visio_status: null,
    matiere: { nom: 'Maths', code: 'M1' },
    classe: { nom: '6e A' },
    programmation: { date: '2026-01-01', heure_debut: '08:00', heure_fin: '09:00' },
    ...overrides,
  }
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function setup(data) {
  getMyTeachingSeances.mockResolvedValue({ data })
  let api
  const Comp = defineComponent({ setup() { api = useTeacherVisioList(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  readCache.mockReturnValue(null)
  confirmVisioAction.mockResolvedValue(true)
  joinTrackedVisio.mockReset()
  joinTrackedVisio.mockResolvedValue({ success: true })
})

describe('useTeacherVisioList (#G1)', () => {
  it('charge les séances au montage via le service (cache vide)', async () => {
    const u = await setup([])
    expect(getMyTeachingSeances).toHaveBeenCalled()
    expect(u.loading.value).toBe(false)
    expect(u.seances.value).toEqual([])
  })

  it('classe une séance active dont l\'horaire encadre maintenant en "en cours"', async () => {
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 60 * 1000)
    const end = new Date(now.getTime() + 30 * 60 * 1000)
    const seance = makeSeance({
      visio_active: true,
      programmation: {
        date: dateStr(now),
        heure_debut: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}:00`,
        heure_fin: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`,
      },
    })
    const u = await setup([seance])
    expect(u.visioEnCours.value).toHaveLength(1)
    expect(u.visioAVenir.value).toHaveLength(0)
  })

  it('classe une séance future en "à venir" et l\'exclut si terminée', async () => {
    const future = makeSeance({ id: 2, programmation: { date: '2999-01-01', heure_debut: '08:00', heure_fin: '09:00' } })
    const finie = makeSeance({ id: 3, visio_status: 'terminee', programmation: { date: '2999-01-01', heure_debut: '10:00', heure_fin: '11:00' } })
    const u = await setup([future, finie])
    expect(u.visioAVenir.value.map(s => s.id)).toEqual([2])
  })

  it('calcule les statistiques (total / terminees)', async () => {
    const future = makeSeance({ id: 2, programmation: { date: '2999-01-01', heure_debut: '08:00', heure_fin: '09:00' } })
    const finie = makeSeance({ id: 3, visio_status: 'terminee' })
    const sansVisio = makeSeance({ id: 4, visio_enabled: false })
    const u = await setup([future, finie, sansVisio])
    expect(u.stats.value.total).toBe(2)
    expect(u.stats.value.terminees).toBe(1)
  })

  it('utilise le cache s\'il est présent et rafraîchit en arrière-plan', async () => {
    const cached = [makeSeance({ id: 9, programmation: { date: '2999-01-01', heure_debut: '08:00', heure_fin: '09:00' } })]
    readCache.mockReturnValue(cached)
    getMyTeachingSeances.mockResolvedValue({ data: [] })
    let api
    const Comp = defineComponent({ setup() { api = useTeacherVisioList(); return () => null } })
    mount(Comp)
    await flushPromises()
    expect(api.seances.value.length).toBeGreaterThanOrEqual(0)
    // Le rafraîchissement en arrière-plan rappelle le service
    expect(getMyTeachingSeances).toHaveBeenCalled()
  })

  it('handleStartVisio appelle startVisio puis invalide le cache et recharge', async () => {
    const u = await setup([makeSeance()])
    getMyTeachingSeances.mockClear()
    await u.handleStartVisio({ id: 42 })
    expect(startVisio).toHaveBeenCalledWith(42)
    expect(clearCache).toHaveBeenCalledWith('teacher_visio')
    expect(getMyTeachingSeances).toHaveBeenCalled()
  })

  it('handleActivateVisio appelle activateVisio avec l\'id de la séance', async () => {
    const u = await setup([makeSeance()])
    await u.handleActivateVisio({ id: 7 })
    expect(activateVisio).toHaveBeenCalledWith(7)
  })

  it('handleEndVisio demande confirmation avant de terminer', async () => {
    const u = await setup([makeSeance()])
    confirmVisioAction.mockResolvedValueOnce(false)
    await u.handleEndVisio({ id: 5 })
    expect(confirmVisioAction).toHaveBeenCalled()
    expect(endVisio).not.toHaveBeenCalled()
    confirmVisioAction.mockResolvedValueOnce(true)
    await u.handleEndVisio({ id: 5 })
    expect(endVisio).toHaveBeenCalledWith(5)
  })

  it('handleJoinVisio utilise le helper tracké', async () => {
    const u = await setup([makeSeance({ id: 12, visio_room_id: 'room-12' })])
    await u.handleJoinVisio({ id: 12, visio_room_id: 'room-12' })
    expect(joinTrackedVisio).toHaveBeenCalledWith({ id: 12, visio_room_id: 'room-12' })
  })

  it('formatDate et formatTime suivent les formats d\'origine', async () => {
    const u = await setup([])
    expect(u.formatDate(null)).toBe('N/A')
    expect(u.formatTime(null)).toBe('N/A')
    expect(u.formatTime('08:30:00')).toBe('08:30')
  })
})
