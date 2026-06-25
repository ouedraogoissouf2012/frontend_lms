/**
 * Test de montage du sous-composant SeanceCardActions (#H6 ≤300).
 * Vérifie les 4 états visio (aucune / programmée / active / terminée) et que
 * les intentions d'action sont émises au clic. Composant feuille, formatters réels.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeanceCardActions from '@/components/seances/SeanceCardActions.vue'

const seanceBase = { id: 7 }

describe('SeanceCardActions (#H6) — états & émissions', () => {
  it('sans visio : affiche l\'activation et émet "activate"', async () => {
    const w = mount(SeanceCardActions, { props: { seance: seanceBase } })
    expect(w.find('.action-none').exists()).toBe(true)
    await w.find('.action-none button').trigger('click')
    expect(w.emitted('activate')[0]).toEqual([seanceBase])
  })

  it('visio programmée (enseignant) : émet "start" et "deactivate"', async () => {
    const seance = { ...seanceBase, visio: { enabled: true, status: 'programmee', room_id: 'r1' } }
    const w = mount(SeanceCardActions, { props: { seance, isEnseignant: true } })
    expect(w.find('.action-scheduled').exists()).toBe(true)
    const buttons = w.findAll('.action-buttons button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(w.emitted('start')[0]).toEqual([seance])
    expect(w.emitted('deactivate')[0]).toEqual([seance])
  })

  it('visio programmée (non enseignant) : pas de boutons, message d\'attente', () => {
    const seance = { ...seanceBase, visio: { enabled: true, status: 'programmee', room_id: 'r1' } }
    const w = mount(SeanceCardActions, { props: { seance, isEnseignant: false } })
    expect(w.find('.action-buttons').exists()).toBe(false)
    expect(w.text()).toContain('En attente que l\'enseignant démarre la séance')
  })

  it('visio active : affiche EN DIRECT et émet "join" puis "end"', async () => {
    const seance = { ...seanceBase, visio: { enabled: true, status: 'active', participants_count: 2 } }
    const w = mount(SeanceCardActions, { props: { seance } })
    expect(w.text()).toContain('Cours EN DIRECT')
    expect(w.text()).toContain('2 participant(s) connecté(s)')
    await w.find('.btn-success').trigger('click')
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('join')[0]).toEqual([seance])
    expect(w.emitted('end')[0]).toEqual([seance])
  })

  it('visio terminée : affiche le récap participants', () => {
    const seance = { ...seanceBase, visio: { enabled: true, status: 'terminee', participants_count: 5 } }
    const w = mount(SeanceCardActions, { props: { seance } })
    expect(w.find('.action-finished').exists()).toBe(true)
    expect(w.text()).toContain('5 participant(s) ont rejoint')
  })
})
