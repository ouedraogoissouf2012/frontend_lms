/**
 * Test de montage de la modale AttendanceDetailModal (G7).
 * Vérifie l'état fermé (rien d'affiché par défaut), l'état ouvert (overlay +
 * état vide quand aucune participation) et l'émission de "close".
 * Composant feuille : aucun service/store/router, utils réels.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal.vue'

describe('AttendanceDetailModal (G7) — montage', () => {
  it('monte fermé sans erreur (pas d\'overlay quand selectedSeance est null)', () => {
    const w = mount(AttendanceDetailModal)
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('ouvert sans participation : affiche l\'overlay et l\'état vide', () => {
    const w = mount(AttendanceDetailModal, {
      props: {
        selectedSeance: { klassci_seance_id: 7, matiere_nom: 'Maths', date: '2026-06-20' },
        attendances: { attendances: [] }
      }
    })
    expect(w.find('.modal-overlay').exists()).toBe(true)
    expect(w.find('.modal-empty').exists()).toBe(true)
  })

  it('émet "close" au clic sur le bouton de fermeture', async () => {
    const w = mount(AttendanceDetailModal, {
      props: {
        selectedSeance: { klassci_seance_id: 7, matiere_nom: 'Maths', date: '2026-06-20' },
        attendances: { attendances: [] }
      }
    })
    await w.find('.modal-close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
