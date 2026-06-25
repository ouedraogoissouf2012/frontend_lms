/**
 * Test du composable useSeanceAttendanceHistory (H7) : chargement des séances,
 * filtres de période/recherche, pagination bornée, ouverture/fermeture de la
 * modale de présences et garde de suppression. Services LMS/export + vue-router
 * mockés. Le bug latent $toast (deleteSeance) est documenté, pas exercé ici.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('vue-router', () => ({ useRoute: () => ({ params: {} }) }))

const getSeancesHistory = vi.fn()
const getSeanceAttendances = vi.fn()
const deleteSeanceSvc = vi.fn()
vi.mock('@/services/lms', () => ({
  default: {
    getSeancesHistory: (...a) => getSeancesHistory(...a),
    getSeanceAttendances: (...a) => getSeanceAttendances(...a),
    deleteSeance: (...a) => deleteSeanceSvc(...a)
  }
}))
vi.mock('@/services/attendanceExport', () => ({
  default: { exportPdf: vi.fn(), exportExcel: vi.fn() }
}))

import { useSeanceAttendanceHistory } from '@/composables/useSeanceAttendanceHistory'

const SEANCES = {
  success: true,
  data: [
    { id: 1, klassci_seance_id: 'S1', matiere: { nom: 'Maths' }, taux_presence: 90 },
    { id: 2, klassci_seance_id: 'S2', matiere: { nom: 'SVT' }, taux_presence: 40 }
  ],
  pagination: { current_page: 1, per_page: 50, total: 2, last_page: 3 }
}

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useSeanceAttendanceHistory(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useSeanceAttendanceHistory (H7)', () => {
  beforeEach(() => {
    getSeancesHistory.mockReset().mockResolvedValue(SEANCES)
    getSeanceAttendances.mockReset().mockResolvedValue({ success: true, attendances: [], statistics: {}, seance: {} })
    deleteSeanceSvc.mockReset().mockResolvedValue({})
  })

  it('charge les séances au montage', async () => {
    const u = await setup()
    expect(getSeancesHistory).toHaveBeenCalled()
    expect(u.seances.value).toHaveLength(2)
    expect(u.loading.value).toBe(false)
  })

  it('selectPeriod recharge sauf en mode custom', async () => {
    const u = await setup()
    getSeancesHistory.mockClear()
    u.selectPeriod('month')
    expect(u.selectedPeriod.value).toBe('month')
    expect(getSeancesHistory).toHaveBeenCalledTimes(1)

    getSeancesHistory.mockClear()
    u.selectPeriod('custom')
    expect(u.selectedPeriod.value).toBe('custom')
    expect(getSeancesHistory).not.toHaveBeenCalled()
  })

  it('changePage ignore les pages hors bornes', async () => {
    const u = await setup()
    getSeancesHistory.mockClear()
    u.changePage(0)
    u.changePage(99)
    expect(getSeancesHistory).not.toHaveBeenCalled()
    u.changePage(2)
    expect(getSeancesHistory).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('viewAttendances charge les présences et sélectionne la séance', async () => {
    const u = await setup()
    await u.viewAttendances(SEANCES.data[0])
    expect(getSeanceAttendances).toHaveBeenCalledWith(1)
    expect(u.selectedSeance.value.id).toBe(1)
    expect(u.attendances.value).toBeTruthy()
    expect(u.loadingAttendances.value).toBe(false)
  })

  it('closeModal réinitialise la sélection', async () => {
    const u = await setup()
    await u.viewAttendances(SEANCES.data[0])
    u.closeModal()
    expect(u.selectedSeance.value).toBe(null)
    expect(u.attendances.value).toBe(null)
    expect(u.attendancesError.value).toBe(null)
  })

  it('clearSearch vide la recherche et recharge', async () => {
    const u = await setup()
    u.searchQuery.value = 'maths'
    getSeancesHistory.mockClear()
    u.clearSearch()
    expect(u.searchQuery.value).toBe('')
    expect(getSeancesHistory).toHaveBeenCalled()
  })

  it('deleteSeance respecte le garde de confirmation (annulation → aucun appel)', async () => {
    const u = await setup()
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await u.deleteSeance(SEANCES.data[0])
    expect(deleteSeanceSvc).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('formateurs locaux : durée et repli date (parité)', async () => {
    const u = await setup()
    expect(u.formatDuration(90)).toBe('1h 30min')
    expect(u.formatDuration(45)).toBe('45 min')
    expect(u.formatDuration(0)).toBe('-')
    expect(u.formatDate(null)).toBe('-')
  })
})
