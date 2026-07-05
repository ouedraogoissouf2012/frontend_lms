/**
 * Test de CalendarEventModal (H8 ≤300) : sous-composant présentationnel du widget
 * calendrier. Rendu du titre/horaire, conditionnels (classe/url), émissions
 * (close / go).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CalendarEventModal from '@/components/widgets/CalendarEventModal.vue'

function mountModal(event = {}) {
  return mount(CalendarEventModal, {
    props: {
      event: {
        title: 'Cours de SVT',
        start: '2025-10-20T09:05:00',
        end: '2025-10-20T10:30:00',
        extendedProps: { classe: '6e A', url: '/seances/1' },
        ...event
      }
    }
  })
}

describe('CalendarEventModal (H8)', () => {
  it('affiche le titre et l’horaire formaté', () => {
    const w = mountModal()
    expect(w.find('.modal-title').text()).toBe('Cours de SVT')
    expect(w.find('.detail-value').text()).toContain('09:05')
    expect(w.find('.detail-value').text()).toContain('10:30')
  })

  it('émet `close` (overlay et bouton) et `go` (footer)', async () => {
    const w = mountModal()
    await w.find('.modal-close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
    await w.find('.action-btn.primary').trigger('click')
    expect(w.emitted('go')).toBeTruthy()
  })

  it('masque le footer si aucune url', () => {
    const w = mountModal({ extendedProps: { classe: '6e A' } })
    expect(w.find('.modal-footer').exists()).toBe(false)
  })
})
