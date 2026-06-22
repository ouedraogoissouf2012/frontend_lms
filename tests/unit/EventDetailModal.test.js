/**
 * Test de montage de EventDetailModal.vue (G8 — Agent B).
 * Composant pur (computeds + format, pas d'appel API). On vérifie :
 *  - montage sans erreur + racine .modal-overlay
 *  - rendu du titre depuis event.title / extendedProps
 *  - émission de l'événement `close` au clic sur le bouton fermer
 *  - émission de `action` (type viewDetails) via le bouton "Voir détails complets"
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EventDetailModal from '@/components/calendar/EventDetailModal.vue'

function mountModal(props = {}) {
  return mount(EventDetailModal, {
    props: {
      event: {
        title: 'Cours de Maths',
        start: '2025-10-20T09:00:00.000Z',
        end: '2025-10-20T11:00:00.000Z',
        extendedProps: {
          eventType: 'seance',
          data: { matiere_nom: 'Maths', classe_nom: '6e A' }
        }
      },
      userRole: 'student',
      ...props
    }
  })
}

describe('EventDetailModal.vue (G8) — montage', () => {
  it('monte sans erreur et affiche la racine .modal-overlay', () => {
    const w = mountModal()
    expect(w.find('.modal-overlay').exists()).toBe(true)
  })

  it('affiche le titre de l’événement', () => {
    const w = mountModal()
    expect(w.find('.modal-title').text()).toBe('Cours de Maths')
  })

  it('émet `close` au clic sur le bouton de fermeture', async () => {
    const w = mountModal()
    await w.find('.close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('émet `action` (viewDetails) au clic sur "Voir détails complets"', async () => {
    const w = mountModal()
    await w.find('.action-btn.outline').trigger('click')
    expect(w.emitted('action')).toBeTruthy()
    expect(w.emitted('action')[0][0].type).toBe('viewDetails')
  })
})
