/**
 * #628 — les crochets de style STABLES de FullCalendar 7 : ses options `…Class`.
 *
 * 1. Une option de classe v7 n'accepte qu'une CHAÎNE (`ClassNameInput = string | falsy`). Un tableau est refusé :
 *    `refineClassName` avertit et rend `''` (lu dans le code de v7.1.5). Nos classes d'événement, qui portent leur
 *    couleur (`--fc-event-color`), doivent donc partir en chaîne, sinon aucun événement n'est coloré.
 * 2. Ce que v6 réglait par des sélecteurs `.fc-*` (classes désormais hachées) passe par ces options : l'en-tête des
 *    jours (`dayHeaderClass`), la cellule du jour et celles hors du mois (`dayCellClass`, `isToday` / `isOther`),
 *    le trait « maintenant » (`nowIndicatorLineClass`), le titre de la barre du widget (`toolbarTitleClass`).
 */
import { mount } from '@vue/test-utils'
import { computed, defineComponent, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { useCalendarView } from '@/composables/useCalendarView'
import { useCalendarWidget } from '@/composables/useCalendarWidget'

function optionsAgenda() {
  return useCalendarView({ calendarRef: ref(null), filteredEvents: computed(() => []), onEventClick: vi.fn() }).calendarOptions.value
}

function optionsWidget() {
  let api
  mount(defineComponent({ setup() { api = useCalendarWidget({ events: [], height: '500px' }, () => {}); return () => null } }))
  return api.calendarOptions.value
}

const evenement = (extendedProps) => ({ event: { extendedProps } })

describe('#628 — les classes d’événement partent en CHAÎNE (v7 refuse un tableau)', () => {
  it('agenda : séance urgente → « event-item event-seance event-urgent »', () => {
    expect(optionsAgenda().eventClass(evenement({ eventType: 'seance', isUrgent: true }))).toBe('event-item event-seance event-urgent')
  })

  it('agenda : sans type → « event-item »', () => {
    expect(optionsAgenda().eventClass(evenement({}))).toBe('event-item')
  })

  it('widget : évaluation → « event-item event-evaluation »', () => {
    expect(optionsWidget().eventClass(evenement({ type: 'evaluation' }))).toBe('event-item event-evaluation')
  })
})

describe('#628 — les crochets v7 remplacent les sélecteurs `.fc-*` de v6', () => {
  it.each([['agenda', optionsAgenda], ['widget', optionsWidget]])('%s : en-tête des jours, cellules du jour et hors du mois, trait « maintenant »', (_, options) => {
    const o = options()
    expect(o.dayHeaderClass).toEqual(expect.any(String))
    expect(o.dayHeaderClass.length).toBeGreaterThan(0)
    expect(o.dayCellClass({ isToday: true, isOther: false })).toBe('lms-jour-aujourdhui')
    expect(o.dayCellClass({ isToday: false, isOther: true })).toBe('lms-jour-hors-mois')
    expect(o.dayCellClass({ isToday: false, isOther: false })).toBe('')
    expect(o.nowIndicatorLineClass).toBe('lms-ligne-maintenant')
  })

  it('agenda : l’en-tête des jours porte le dégradé bleu de v6 (sa propre classe)', () => {
    expect(optionsAgenda().dayHeaderClass).toBe('lms-entete-agenda')
  })

  it('widget : l’en-tête neutre et le titre de la barre ont leur classe', () => {
    const o = optionsWidget()
    expect(o.dayHeaderClass).toBe('lms-entete-widget')
    expect(o.toolbarTitleClass).toBe('lms-titre-widget')
  })

  it('aucune option de classe ne rend un tableau', () => {
    for (const o of [optionsAgenda(), optionsWidget()]) {
      for (const [cle, valeur] of Object.entries(o).filter(([k]) => /Class$/.test(k))) {
        const rendu = typeof valeur === 'function' ? valeur({ event: { extendedProps: {} }, isToday: false, isOther: false }) : valeur
        expect([cle, Array.isArray(rendu)]).toEqual([cle, false])
      }
    }
  })
})
