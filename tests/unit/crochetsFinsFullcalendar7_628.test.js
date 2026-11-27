/**
 * #628 — les réglages fins de v6 retrouvés par des crochets STABLES de v7 (mesurés sur les paires pleine page).
 *
 * Le thème classic (themes/classic.js de v7.1.5) pose un numéro de jour à 14 px, calé à droite (`justify-content:
 * flex-end`), un jour hors du mois en simple `--fc-classic-faint-foreground`, un texte d'en-tête à 14 px sans
 * marge, des boutons bleus. v7 JOINT nos classes aux siennes (`joinFuncishClassNames`) : nos options `…Class`
 * ajoutent nos réglages sans retirer ceux du thème.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { computed, defineComponent, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { useCalendarView } from '@/composables/useCalendarView'
import { useCalendarWidget } from '@/composables/useCalendarWidget'
import { classeDuNumero } from '@/utils/fullcalendarClasses'

const lire = (f) => readFileSync(resolve(process.cwd(), f), 'utf8')

function optionsAgenda() {
  return useCalendarView({ calendarRef: ref(null), filteredEvents: computed(() => []), onEventClick: vi.fn() }).calendarOptions.value
}

function optionsWidget() {
  let api
  mount(defineComponent({ setup() { api = useCalendarWidget({ events: [], height: '500px' }, () => {}); return () => null } }))
  return api.calendarOptions.value
}

describe('#628 — le numéro du jour', () => {
  it('porte toujours lms-numero, plus le jour courant ou le jour hors du mois', () => {
    expect(classeDuNumero({ isToday: false, isOther: false })).toBe('lms-numero')
    expect(classeDuNumero({ isToday: true, isOther: false })).toBe('lms-numero lms-numero-aujourdhui')
    expect(classeDuNumero({ isToday: false, isOther: true })).toBe('lms-numero lms-numero-hors-mois')
  })

  it.each([['agenda', optionsAgenda], ['widget', optionsWidget]])('%s : le numéro passe par dayCellTopInnerClass', (_, options) => {
    expect(options().dayCellTopInnerClass).toBe(classeDuNumero)
  })

  it('le jour hors du mois retrouve l’opacité 0.3 de v6, dans les deux calendriers', () => {
    for (const f of ['src/components/calendar/CalendarView.vue', 'src/components/widgets/CalendarWidget.vue']) {
      expect(lire(f)).toMatch(/:deep\(\.lms-numero-hors-mois\) \{\s*opacity: 0\.3;/)
    }
  })

  it('agenda : le numéro du jour courant reprend le bleu gras de v6', () => {
    expect(lire('src/components/calendar/CalendarView.vue')).toMatch(/:deep\(\.lms-numero-aujourdhui\) \{\s*color: var\(--color-info-strong\);\s*font-weight: 700;/)
  })

  it('widget : le numéro est CENTRÉ, comme en v6 (le thème le cale à droite)', () => {
    expect(optionsWidget().dayCellTopClass).toBe('lms-haut-centre')
    expect(lire('src/components/widgets/CalendarWidget.vue')).toMatch(/:deep\(\.lms-haut-centre\) \{\s*justify-content: center;/)
  })
})

describe('#628 — le texte de l’en-tête des jours et les boutons du widget', () => {
  it('agenda et widget : le texte d’en-tête a sa classe (marge et taille de v6)', () => {
    expect(optionsAgenda().dayHeaderInnerClass).toBe('lms-entete-agenda-texte')
    expect(optionsWidget().dayHeaderInnerClass).toBe('lms-entete-widget-texte')
    expect(lire('src/components/calendar/CalendarView.vue')).toMatch(/:deep\(\.lms-entete-agenda-texte\) \{[^}]*padding: 0\.75rem 0\.5rem;/)
    expect(lire('src/components/widgets/CalendarWidget.vue')).toMatch(/:deep\(\.lms-entete-widget-texte\) \{[^}]*padding: 0\.75rem 0\.5rem;/)
  })

  it('widget : ses boutons reprennent le style neutre de v6 (le thème les peint en bleu)', () => {
    expect(optionsWidget().buttonClass).toBe('lms-bouton-widget')
    expect(lire('src/components/widgets/CalendarWidget.vue')).toMatch(/:deep\(\.lms-bouton-widget\) \{[^}]*background: var\(--bg-secondary\);/)
  })

  it('l’agenda garde les boutons du thème : seul le widget est neutre', () => {
    expect(optionsAgenda().buttonClass).toBeUndefined()
  })
})

describe('#628 — une séance d’un jour avec heure reste une BARRE (décision de la superviseure)', () => {
  // v7 (comme v6) dessine en POINT un événement d'un seul jour avec heure, en vue mois (`hasListItemDisplay`, mode
  // 'auto'). En v6, nos classes peignaient ce point en barre ; v7 hache ses classes : l'option le fige.
  it.each([['agenda', optionsAgenda], ['widget', optionsWidget]])('%s : eventDisplay « block »', (_, options) => {
    expect(options().eventDisplay).toBe('block')
  })
})
