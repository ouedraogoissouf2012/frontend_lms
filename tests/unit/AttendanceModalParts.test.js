/**
 * Tests de RENDU des sous-composants de la modale de présences éclatée (H7) :
 * AttendanceModalHeader / Table / Footer, plus le relais d'events par le wrapper
 * AttendanceDetailModal. Complète le test de montage existant (G7) en couvrant
 * l'enchaînement d'états et les nouvelles frontières props/emits.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal.vue'
import AttendanceModalHeader from '@/components/attendance/AttendanceModalHeader.vue'
import AttendanceModalTable from '@/components/attendance/AttendanceModalTable.vue'
import AttendanceModalFooter from '@/components/attendance/AttendanceModalFooter.vue'

const seance = { klassci_seance_id: 'S-42', matiere_nom: 'Maths', date: '2026-06-01' }

const populated = {
  seance: { is_finished: true, enseignant_nom: 'Mme Z', visio_started_at: '2026-06-01T08:00:00', visio_ended_at: '2026-06-01T09:00:00', duration_minutes: 60 },
  attendances: [
    { id: 1, nom: 'Aline', email: 'aline@e.com', joined_at: '2026-06-01T08:05:00', left_at: '2026-06-01T08:55:00', duration_minutes: 50, status_level: 'present', presence_status: 'Présent', participation_percentage: 90 }
  ],
  statistics: { total_participants: 1, average_duration: 50, presence_rate: 90 }
}

describe('AttendanceDetailModal (H7) — wrapper', () => {
  it('rend header + footer quand une séance est sélectionnée', () => {
    const w = mount(AttendanceDetailModal, { props: { selectedSeance: seance } })
    expect(w.findComponent(AttendanceModalHeader).exists()).toBe(true)
    expect(w.findComponent(AttendanceModalFooter).exists()).toBe(true)
  })

  it('affiche le tableau quand des présences sont chargées', () => {
    const w = mount(AttendanceDetailModal, { props: { selectedSeance: seance, attendances: populated } })
    expect(w.findComponent(AttendanceModalTable).exists()).toBe(true)
  })

  it('affiche chargement, puis erreur selon les props', () => {
    const loading = mount(AttendanceDetailModal, { props: { selectedSeance: seance, loadingAttendances: true } })
    expect(loading.find('.modal-loading').exists()).toBe(true)

    const err = mount(AttendanceDetailModal, { props: { selectedSeance: seance, attendancesError: 'Boom' } })
    expect(err.find('.modal-error').text()).toContain('Boom')
  })

  it('relaie close/retry/export-pdf/export-excel au parent', async () => {
    const w = mount(AttendanceDetailModal, { props: { selectedSeance: seance, attendancesError: 'Boom' } })
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
    await w.find('.btn-retry').trigger('click')
    expect(w.emitted('retry')).toBeTruthy()
    await w.findComponent(AttendanceModalFooter).find('.btn-export-pdf').trigger('click')
    expect(w.emitted('export-pdf')).toBeTruthy()
    await w.findComponent(AttendanceModalFooter).find('.btn-export-excel').trigger('click')
    expect(w.emitted('export-excel')).toBeTruthy()
  })
})

describe('AttendanceModalHeader (H7)', () => {
  it('affiche titre, enseignant, créneau (durée) et sous-titre ; émet close', async () => {
    const w = mount(AttendanceModalHeader, { props: { selectedSeance: seance, attendances: populated } })
    expect(w.find('.modal-title').text()).toBe('Liste de Présence')
    expect(w.text()).toContain('Mme Z')
    expect(w.find('.modal-subtitle').text()).toContain('S-42')
    expect(w.find('.modal-seance-time').text()).toContain('(1h)')
    await w.find('.modal-close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})

describe('AttendanceModalTable (H7)', () => {
  it('rend une ligne par participant, le badge de statut et les statistiques', () => {
    const w = mount(AttendanceModalTable, { props: { attendances: populated } })
    expect(w.findAll('tbody tr')).toHaveLength(1)
    expect(w.find('.status-badge.status-present').exists()).toBe(true)
    expect(w.text()).toContain('90%')
    expect(w.find('.modal-stats').text()).toContain('Total participants')
  })

  it('affiche la bannière « séance en cours » si non terminée', () => {
    const ongoing = { ...populated, seance: { ...populated.seance, is_finished: false } }
    const w = mount(AttendanceModalTable, { props: { attendances: ongoing } })
    expect(w.find('.modal-info-banner').exists()).toBe(true)
  })
})

describe('AttendanceModalFooter (H7)', () => {
  it('désactive les exports pendant l\'export et émet close', async () => {
    const w = mount(AttendanceModalFooter, { props: { exporting: true } })
    expect(w.find('.btn-export-pdf').attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Export...')
    await w.find('.btn-modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
