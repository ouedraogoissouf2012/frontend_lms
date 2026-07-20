/**
 * Test de CalendarCompactAgenda.vue : rendu alternatif mobile du calendrier.
 * Il doit afficher les événements triés et émettre l'événement sélectionné.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CalendarCompactAgenda from '@/components/calendar/CalendarCompactAgenda.vue'

const events = [
  {
    id: 'late',
    title: 'Après-midi',
    start: '2026-07-15T15:00:00.000Z',
    end: '2026-07-15T16:00:00.000Z',
    backgroundColor: 'rgb(59, 130, 246)'
  },
  {
    id: 'early',
    title: 'Matin',
    start: '2026-07-15T08:00:00.000Z',
    end: '2026-07-15T09:00:00.000Z'
  }
]

function mountAgenda(props = {}) {
  return mount(CalendarCompactAgenda, {
    props: { events, ...props }
  })
}

describe('CalendarCompactAgenda.vue', () => {
  it('affiche les événements triés chronologiquement', () => {
    const w = mountAgenda()
    const items = w.findAll('.agenda-item')

    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Matin')
    expect(items[1].text()).toContain('Après-midi')
  })

  it('émet select avec l’événement cliqué', async () => {
    const w = mountAgenda()

    await w.find('.agenda-item').trigger('click')

    expect(w.emitted('select')).toBeTruthy()
    expect(w.emitted('select')[0][0].id).toBe('early')
  })

  it('affiche un état vide', () => {
    const w = mountAgenda({ events: [] })
    expect(w.find('.agenda-empty').text()).toContain('Aucun événement')
  })
})
