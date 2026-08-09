/**
 * #238 — useCalendarEvents doit exposer un état d'erreur DISTINCT d'un agenda
 * vide : sur panne de chargement, `error` est renseigné (via error.userMessage
 * de l'intercepteur) au lieu d'avaler l'exception et d'afficher zéro événement.
 */
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const lmsMock = vi.hoisted(() => ({
  getMyClassesSeances: vi.fn(),
  getMyTeachingSeances: vi.fn(),
  getUpcomingSeances: vi.fn(),
}))
const evalMock = vi.hoisted(() => ({
  getStudentEvaluations: vi.fn(),
  getEvaluations: vi.fn(),
}))
vi.mock('@/services/lms', () => ({ lmsService: lmsMock }))
vi.mock('@/services/evaluation', () => ({ default: evalMock }))

import { useCalendarEvents } from '@/composables/useCalendarEvents'

function makeComposable() {
  return useCalendarEvents({
    getUserRole: () => 'student',
    getUserId: () => 1,
    eventTypeFilter: ref('seances'), // n'active que le chargement des séances
    dateRangePreset: ref('month'),
  })
}

describe('useCalendarEvents (#238)', () => {
  beforeEach(() => {
    lmsMock.getMyClassesSeances.mockReset()
  })

  it('renseigne error quand le chargement des séances échoue (pas un vide silencieux)', async () => {
    lmsMock.getMyClassesSeances.mockRejectedValue({ userMessage: 'Service indisponible' })
    const c = makeComposable()

    await c.loadEvents()

    expect(c.events.value).toEqual([])
    expect(c.error.value).toBe('Service indisponible')
  })

  it('laisse error à null quand le chargement réussit', async () => {
    lmsMock.getMyClassesSeances.mockResolvedValue({ data: [] })
    const c = makeComposable()

    await c.loadEvents()

    expect(c.error.value).toBeNull()
  })
})
