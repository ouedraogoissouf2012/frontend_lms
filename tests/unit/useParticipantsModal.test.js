/**
 * Test du composable useParticipantsModal (#H13 ≤300) : chargement de la liste de
 * présence au montage, auto-refresh (setInterval 15 s), gestion d'erreur, formatage
 * (durée/initiales) et computed seanceTime/seanceDuration. Services mockés via vi.mock
 * (calqué sur useAdminUsers.test.js). Le composable utilise onMounted/onBeforeUnmount :
 * on le monte dans un composant hôte jetable.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { getVisioParticipants } = vi.hoisted(() => ({
  getVisioParticipants: vi.fn()
}))

vi.mock('@/services/lms', () => ({
  default: { getVisioParticipants },
  lmsService: { getVisioParticipants }
}))
vi.mock('@/services/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: (e) => ({ userMessage: String(e) }) }))
vi.mock('@/constants/http', () => ({ apiBaseUrl: () => 'http://test', API_TIMEOUT_MS: 30000 }))

import { useParticipantsModal } from '@/composables/useParticipantsModal'

function setup(seanceId = 42) {
  let api
  const Comp = defineComponent({
    setup() {
      api = useParticipantsModal(ref(seanceId))
      return () => null
    }
  })
  const wrapper = mount(Comp, { global: { plugins: [createPinia()] } })
  return { api, wrapper }
}

describe('useParticipantsModal (#H13)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    getVisioParticipants.mockReset()
    getVisioParticipants.mockResolvedValue({
      success: true,
      data: { students: [], statistics: {}, teacher: null, coordinator: null }
    })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('charge les participants au montage avec le seanceId', async () => {
    const { api } = setup(7)
    await flushPromises()
    expect(getVisioParticipants).toHaveBeenCalledWith(7)
    expect(api.loading.value).toBe(false)
  })

  it('peuple students/teacher/coordinator/stats depuis la réponse', async () => {
    getVisioParticipants.mockResolvedValue({
      success: true,
      data: {
        students: [{ user_id: 1, nom: 'Doe', prenom: 'Jane', is_present: true }],
        statistics: { total_students: 5, present_count: 3, seance_duration_minutes: 90 },
        teacher: { nom: 'Prof' },
        coordinator: { nom: 'Coord' },
        seance_info: { heure_debut: '08:00', heure_fin: '10:00' }
      }
    })
    const { api } = setup()
    await flushPromises()
    expect(api.students.value).toHaveLength(1)
    expect(api.teacher.value).toEqual({ nom: 'Prof' })
    expect(api.coordinator.value).toEqual({ nom: 'Coord' })
    expect(api.stats.value.total_students).toBe(5)
    expect(api.seanceTime.value).toBe('08:00 - 10:00')
    expect(api.seanceDuration.value).toBe('1h 30min')
  })

  it('renseigne error et arrête le loading en cas d’échec du service', async () => {
    getVisioParticipants.mockRejectedValue(new Error('boom'))
    const { api } = setup()
    await flushPromises()
    expect(api.error.value).toBe('boom')
    expect(api.loading.value).toBe(false)
  })

  it('renseigne error si la réponse n’a pas success', async () => {
    getVisioParticipants.mockResolvedValue({ success: false, message: 'refus' })
    const { api } = setup()
    await flushPromises()
    expect(api.error.value).toBe('refus')
  })

  it('relance loadParticipants en silencieux toutes les 15 s (auto-refresh)', async () => {
    setup()
    await flushPromises()
    expect(getVisioParticipants).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(15000)
    expect(getVisioParticipants).toHaveBeenCalledTimes(2)
  })

  it('arrête l’intervalle au démontage', async () => {
    const { wrapper } = setup()
    await flushPromises()
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('formatDuration : minutes seules, heures+minutes, et zéro → "-"', async () => {
    const { api } = setup()
    await flushPromises()
    expect(api.formatDuration(0)).toBe('-')
    expect(api.formatDuration(null)).toBe('-')
    expect(api.formatDuration(45)).toBe('45min')
    expect(api.formatDuration(90)).toBe('1h30')
  })

  it('getInitials : nom complet, nom simple, et vide → "?"', async () => {
    const { api } = setup()
    await flushPromises()
    expect(api.getInitials('Jean Dupont')).toBe('JD')
    expect(api.getInitials('Alice')).toBe('AL')
    expect(api.getInitials('')).toBe('?')
  })

  it('seanceTime vaut null sans horaires', async () => {
    const { api } = setup()
    await flushPromises()
    expect(api.seanceTime.value).toBe(null)
  })
})
