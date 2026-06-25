/**
 * Test du composable useEventDetail (H8 ≤300) : type d'événement, titre, statut,
 * capacités selon le rôle, formatage et émission d'action.
 */
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { useEventDetail } from '@/composables/useEventDetail'

function setup(event, userRole) {
  let api
  const emitted = []
  const Comp = defineComponent({
    setup() {
      api = useEventDetail({ event, userRole }, (e, p) => emitted.push([e, p]))
      return () => null
    }
  })
  mount(Comp)
  return { api, emitted }
}

const seance = (data = {}) => ({
  title: 'Cours', start: '2025-10-20T09:00:00', end: '2025-10-20T10:00:00',
  extendedProps: { eventType: 'seance', data: { titre: 'Maths', ...data } }
})
const evaluation = (data = {}) => ({
  title: 'Éval', start: '2025-10-20T09:00:00',
  extendedProps: { eventType: 'evaluation', data: { ...data } }
})

describe('useEventDetail (H8)', () => {
  it('détermine le type et le titre (data.titre prioritaire)', () => {
    const { api } = setup(seance(), 'student')
    expect(api.isSeance.value).toBe(true)
    expect(api.eventTitle.value).toBe('Maths')
  })

  it('mappe le statut séance selon la visio (active → En direct)', () => {
    const { api } = setup(seance({ visio: { status: 'active' } }), 'student')
    expect(api.statusClass.value).toBe('status-active')
    expect(api.statusLabel.value).toBe('En direct')
    expect(api.visioStatusText.value).toBe('En direct')
  })

  it('canJoinVisio: vrai seulement pour un étudiant si la visio est active', () => {
    expect(setup(seance({ visio: { status: 'active' } }), 'student').api.canJoinVisio.value).toBe(true)
    expect(setup(seance({ visio: { status: 'programmee' } }), 'student').api.canJoinVisio.value).toBe(false)
    expect(setup(seance({ visio: { status: 'active' } }), 'teacher').api.canJoinVisio.value).toBe(false)
  })

  it('capacités enseignant: activer/démarrer/terminer selon état visio', () => {
    expect(setup(seance({ visio: { enabled: false } }), 'teacher').api.canActivateVisio.value).toBe(true)
    expect(setup(seance({ visio: { enabled: true, status: 'programmee' } }), 'teacher').api.canStartVisio.value).toBe(true)
    expect(setup(seance({ visio: { enabled: true, status: 'active' } }), 'teacher').api.canEndVisio.value).toBe(true)
  })

  it('canStartEvaluation: étudiant, éval non terminée et non soumise', () => {
    expect(setup(evaluation({ status: 'programmee' }), 'student').api.canStartEvaluation.value).toBe(true)
    expect(setup(evaluation({ status: 'terminee' }), 'student').api.canStartEvaluation.value).toBe(false)
  })

  it('formate la date (fr-FR) et émet une action avec data', () => {
    const { api, emitted } = setup(seance(), 'student')
    expect(api.formattedDate.value).toContain('2025')
    api.emitAction('viewDetails')
    expect(emitted[0][0]).toBe('action')
    expect(emitted[0][1]).toEqual({ type: 'viewDetails', data: { titre: 'Maths' } })
  })
})
