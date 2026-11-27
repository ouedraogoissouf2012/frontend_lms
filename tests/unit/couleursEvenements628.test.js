/**
 * #628 — la couleur des événements sous FullCalendar 7 (mesurée sur les paires de captures avant/après).
 *
 * Deux faits de v7.1.5, lus dans son code :
 *   1. un événement ne lit plus `backgroundColor` ni `borderColor` : `EVENT_UI_REFINERS` ne garde que `color` et
 *      `contrastColor`. Les couleurs de nos données (orange : évaluation, rouge : urgente, vert : visio active…)
 *      étaient donc ignorées en silence ;
 *   2. le thème classic pose `eventColor: "var(--fc-classic-event)"`, que v7 écrit EN LIGNE (`--fc-event-color`) sur
 *      chaque événement : une règle de classe sans `!important` ne peut plus le recouvrir. Tout était bleu.
 * En v6, l'agenda montrait la couleur des DONNÉES (ses classes étaient sans `!important`, sauf l'urgence), le widget
 * celle de ses CLASSES (toutes en `!important`). Le portage garde exactement ces priorités.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const lmsMock = vi.hoisted(() => ({ getMyClassesSeances: vi.fn(), getMyTeachingSeances: vi.fn(), getUpcomingSeances: vi.fn() }))
const evalMock = vi.hoisted(() => ({ getStudentEvaluations: vi.fn(), getEvaluations: vi.fn() }))
vi.mock('@/services/lms', () => ({ lmsService: lmsMock }))
vi.mock('@/services/evaluation', () => ({ default: evalMock }))

import { useCalendarEvents } from '@/composables/useCalendarEvents'

const lire = (f) => readFileSync(resolve(process.cwd(), f), 'utf8')

async function evenements(type) {
  const c = useCalendarEvents({ getUserRole: () => 'admin', getUserId: () => 1, eventTypeFilter: ref(type), dateRangePreset: ref('month') })
  await c.loadEvents()
  return c.events.value
}

const dansHeures = (h) => new Date(Date.now() + h * 3600000).toISOString()

beforeEach(() => {
  vi.clearAllMocks()
  lmsMock.getUpcomingSeances.mockResolvedValue({ data: [] })
  evalMock.getEvaluations.mockResolvedValue({ data: [] })
})

describe('#628 — l’agenda passe la couleur de ses données par la clé `color` de v7', () => {
  it('séance sans visio : bleu ; visio active : vert — et plus aucune clé ignorée par v7', async () => {
    lmsMock.getUpcomingSeances.mockResolvedValue({ data: [
      { id: 1, date_seance: dansHeures(48), matiere: { nom: 'Maths' } },
      { id: 2, date_seance: dansHeures(48), matiere: { nom: 'SVT' }, visio: { status: 'active' } },
    ] })
    const [a, b] = await evenements('seances')
    expect([a.color, b.color]).toEqual(['#2563eb', '#10b981'])
    for (const e of [a, b]) expect([e.backgroundColor, e.borderColor]).toEqual([undefined, undefined])
  })

  it('évaluation : orange ; dans moins de 24 h : rouge', async () => {
    evalMock.getEvaluations.mockResolvedValue({ data: [
      { id: 1, titre: 'Plus tard', date_evaluation: dansHeures(72) },
      { id: 2, titre: 'Bientôt', date_evaluation: dansHeures(2) },
    ] })
    const [plusTard, bientot] = await evenements('evaluations')
    expect([plusTard.color, bientot.color]).toEqual(['#ea580c', '#ef4444'])
    expect(bientot.extendedProps.isUrgent).toBe(true)
  })
})

describe('#628 — les classes qui doivent gagner sur la couleur EN LIGNE de v7 le font par `!important`', () => {
  it('le thème classic écrit bien sa couleur d’événement en ligne (la raison de ces `!important`)', () => {
    expect(lire('node_modules/@fullcalendar/vue3/themes/classic.js')).toContain('eventColor: "var(--fc-classic-event)"')
  })

  it('widget : chaque type garde la couleur de SA classe, comme en v6', () => {
    const widget = lire('src/components/widgets/CalendarWidget.vue')
    for (const [classe, jeton] of [['seance', 'blue-500'], ['evaluation', 'amber-500'], ['visio', 'emerald-500']]) {
      expect(widget).toMatch(new RegExp(`:deep\\(\\.event-${classe}\\) \\{\\s*--fc-event-color: var\\(--${jeton}\\) !important;`))
    }
  })

  it('agenda : l’urgence reste rouge quelle que soit la donnée, comme en v6', () => {
    expect(lire('src/components/calendar/CalendarView.vue')).toMatch(/:deep\(\.event-urgent\) \{\s*--fc-event-color: var\(--red-500\) !important;/)
  })

  it('agenda : plus de règle de couleur morte sur séance et évaluation (la donnée gagnait déjà en v6)', () => {
    const agenda = lire('src/components/calendar/CalendarView.vue')
    expect(agenda).not.toMatch(/:deep\(\.event-(seance|evaluation)\)/)
  })
})
