/**
 * Lecture honnête, point 8 : dans une école créée depuis le LMS, une séance peut n'avoir ni classe, et
 * une classe ni filière ni niveau (spec 3d / 3b). Un libellé ne pend jamais sur un « - » orphelin.
 */
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const lmsMock = vi.hoisted(() => ({
  getMyClassesSeances: vi.fn(),
  getMyTeachingSeances: vi.fn(),
  getUpcomingSeances: vi.fn(),
}))
vi.mock('@/services/lms', () => ({ lmsService: lmsMock }))
vi.mock('@/services/evaluation', () => ({ default: { getStudentEvaluations: vi.fn(), getEvaluations: vi.fn() } }))

import { useCalendarEvents } from '@/composables/useCalendarEvents'
import CoordinatorSeanceFilters from '@/components/seances/CoordinatorSeanceFilters.vue'

async function titres(seances) {
  lmsMock.getMyClassesSeances.mockResolvedValue({ data: seances })
  const c = useCalendarEvents({
    getUserRole: () => 'student', getUserId: () => 1,
    eventTypeFilter: ref('seances'), dateRangePreset: ref('month'),
  })
  await c.loadEvents()
  return c.events.value.map((e) => e.title)
}

describe('calendrier — titre d’une séance', () => {
  it('sans classe : la matière seule, sans « - » final', async () => {
    expect(await titres([{ id: 1, matiere: { id: null, nom: 'Maths' }, classe: null, date_seance: '2026-11-12' }]))
      .toEqual(['Maths'])
  })

  it('avec classe : « matière - classe » comme avant', async () => {
    expect(await titres([{ id: 2, matiere: { nom: 'Maths' }, classe: { nom: '6e A' }, date_seance: '2026-11-12' }]))
      .toEqual(['Maths - 6e A'])
  })
})

describe('filtre de classe du coordinateur — libellé', () => {
  const options = (classes) => mount(CoordinatorSeanceFilters, { props: { classes } })
    .findAll('select')[2].findAll('option').slice(1).map((o) => o.text())

  it('ni filière ni niveau : le nom seul, sans « - » final', () => {
    expect(options([{ id: 1, name: '6e A', filiere: null, niveau: null }])).toEqual(['6e A'])
  })

  it('filière et niveau : « nom - filière niveau » comme avant', () => {
    expect(options([{ id: 2, nom: 'T1', filiere: { nom: 'Sciences' }, niveau: { name: 'Terminale' } }]))
      .toEqual(['T1 - Sciences Terminale'])
  })
})
