/**
 * Test du composable useAttendanceHistory (H7) : chargement de l'historique,
 * valeurs dérivées (moyenne, comptes connecté/déconnecté), pagination bornée,
 * sélection/fermeture du détail et réinitialisation des filtres.
 * Services LMS + auth mockés ; formateurs locaux (heure avec secondes) vérifiés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getAttendanceHistory = vi.fn()
vi.mock('@/services/lms', () => ({ default: { getAttendanceHistory: (...a) => getAttendanceHistory(...a) } }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ role: 'enseignant' }) } }))

import { useAttendanceHistory } from '@/composables/useAttendanceHistory'

const RESPONSE = {
  success: true,
  data: [
    { id: 1, status: 'connected', duration_minutes: 30, user: { name: 'A', email: 'a@e.com' }, seance: { klassci_seance_id: 7, date: '2026-06-01' }, joined_at: '2026-06-01T08:00:00' },
    { id: 2, status: 'disconnected', duration_minutes: 50, user: { name: 'B', email: 'b@e.com' }, seance: { klassci_seance_id: 8, date: '2026-06-02' }, joined_at: '2026-06-02T09:00:00' }
  ],
  pagination: { current_page: 1, per_page: 50, total: 2, last_page: 3 }
}

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAttendanceHistory(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAttendanceHistory (H7)', () => {
  beforeEach(() => {
    getAttendanceHistory.mockReset()
    getAttendanceHistory.mockResolvedValue(RESPONSE)
  })

  it('charge l\'historique au montage et expose les données', async () => {
    const u = await setup()
    expect(getAttendanceHistory).toHaveBeenCalled()
    expect(u.attendances.value).toHaveLength(2)
    expect(u.pagination.value.last_page).toBe(3)
    expect(u.loading.value).toBe(false)
  })

  it('calcule moyenne et comptes connecté/déconnecté', async () => {
    const u = await setup()
    expect(u.averageDuration.value).toBe(40) // round((30+50)/2)
    expect(u.connectedCount.value).toBe(1)
    expect(u.disconnectedCount.value).toBe(1)
  })

  it('loadPage ignore les pages hors bornes et charge les pages valides', async () => {
    const u = await setup()
    getAttendanceHistory.mockClear()
    u.loadPage(0)
    u.loadPage(4)
    expect(getAttendanceHistory).not.toHaveBeenCalled()
    u.loadPage(2)
    expect(getAttendanceHistory).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('viewDetails / closeDetails pilotent selectedAttendance', async () => {
    const u = await setup()
    u.viewDetails({ id: 99 })
    expect(u.selectedAttendance.value).toEqual({ id: 99 })
    u.closeDetails()
    expect(u.selectedAttendance.value).toBe(null)
  })

  it('resetFilters efface la séance et recharge', async () => {
    const u = await setup()
    u.filters.seanceId = '123'
    getAttendanceHistory.mockClear()
    u.resetFilters()
    expect(u.filters.seanceId).toBe('')
    expect(getAttendanceHistory).toHaveBeenCalled()
  })

  it('formatTime conserve les secondes (parité locale)', async () => {
    const u = await setup()
    // 08:00:00 → "08:00:00" (heure FR avec secondes)
    expect(u.formatTime('2026-06-01T08:00:00')).toMatch(/08:00:00/)
    expect(u.formatDate(null)).toBe('-')
  })

  it('remonte l\'erreur quand le service échoue', async () => {
    getAttendanceHistory.mockRejectedValueOnce(new Error('Boom'))
    const u = await setup()
    expect(u.error.value).toBe('Boom')
    expect(u.loading.value).toBe(false)
  })
})
