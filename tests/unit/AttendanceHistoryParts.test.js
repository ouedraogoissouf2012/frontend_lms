/**
 * Tests de RENDU des sous-composants de l'historique des présences (H7) :
 * Filters / Stats / Table / ParticipationModal. Vérifie le montage, les v-model,
 * la visibilité conditionnelle (colonne Participant) et les events émis.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AttendanceHistoryFilters from '@/components/attendance/AttendanceHistoryFilters.vue'
import AttendanceHistoryStats from '@/components/attendance/AttendanceHistoryStats.vue'
import AttendanceHistoryTable from '@/components/attendance/AttendanceHistoryTable.vue'
import AttendanceParticipationModal from '@/components/attendance/AttendanceParticipationModal.vue'

const fmtDate = (d) => d ? `D(${d})` : '-'
const fmtTime = (d) => d ? `T(${d})` : '-'
const fmtDateTime = (d) => d ? `DT(${d})` : '-'

const attendance = {
  id: 1, status: 'connected', duration_minutes: 30,
  user: { name: 'Aline', email: 'aline@e.com' },
  seance: { klassci_seance_id: 7, date: '2026-06-01', matiere: { nom: 'Maths' }, classe: { nom: '6e A' } },
  joined_at: '2026-06-01T08:00:00', left_at: null, last_seen_at: '2026-06-01T08:30:00'
}
const pagination = { current_page: 2, per_page: 50, total: 120, last_page: 3 }

describe('AttendanceHistoryFilters (H7)', () => {
  it('affiche le bouton reset seulement si un filtre est rempli et émet reset', async () => {
    const empty = mount(AttendanceHistoryFilters, { props: { dateFrom: '', dateTo: '', seanceId: '' } })
    expect(empty.find('.btn-reset').exists()).toBe(false)

    const w = mount(AttendanceHistoryFilters, { props: { dateFrom: '2026-06-01', dateTo: '', seanceId: '' } })
    expect(w.find('.btn-reset').exists()).toBe(true)
    await w.find('.btn-reset').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('émet change sur les dates et input sur la séance', async () => {
    const w = mount(AttendanceHistoryFilters, { props: { dateFrom: '', dateTo: '', seanceId: '' } })
    const inputs = w.findAll('input')
    await inputs[0].trigger('change')
    expect(w.emitted('change')).toBeTruthy()
    await inputs[2].trigger('input')
    expect(w.emitted('input')).toBeTruthy()
  })
})

describe('AttendanceHistoryStats (H7)', () => {
  it('affiche les quatre cartes avec leurs valeurs', () => {
    const w = mount(AttendanceHistoryStats, { props: { total: 120, averageDuration: 40, connectedCount: 7, disconnectedCount: 3 } })
    expect(w.findAll('.stat-card')).toHaveLength(4)
    expect(w.text()).toContain('120')
    expect(w.text()).toContain('40 min')
  })
})

describe('AttendanceHistoryTable (H7)', () => {
  it('affiche la colonne Participant pour un non-étudiant et émet les events', async () => {
    const w = mount(AttendanceHistoryTable, {
      props: { attendances: [attendance], user: { role: 'enseignant' }, pagination, formatDate: fmtDate, formatTime: fmtTime }
    })
    expect(w.html()).toContain('Participant')
    expect(w.text()).toContain('Maths')
    await w.find('.btn-export').trigger('click')
    expect(w.emitted('export')).toBeTruthy()
    await w.find('.btn-action').trigger('click')
    expect(w.emitted('view-details')[0]).toEqual([attendance])
  })

  it('masque la colonne Participant pour un étudiant', () => {
    const w = mount(AttendanceHistoryTable, {
      props: { attendances: [attendance], user: { role: 'etudiant' }, pagination, formatDate: fmtDate, formatTime: fmtTime }
    })
    expect(w.html()).not.toContain('Participant')
  })

  it('émet load-page avec la page voisine via la pagination', async () => {
    const w = mount(AttendanceHistoryTable, {
      props: { attendances: [attendance], user: { role: 'enseignant' }, pagination, formatDate: fmtDate, formatTime: fmtTime }
    })
    const [prev, next] = w.findAll('.btn-page')
    await prev.trigger('click')
    expect(w.emitted('load-page')[0]).toEqual([1])
    await next.trigger('click')
    expect(w.emitted('load-page')[1]).toEqual([3])
  })
})

describe('AttendanceParticipationModal (H7)', () => {
  it('ne rend rien sans participation', () => {
    const w = mount(AttendanceParticipationModal, { props: { attendance: null, formatDate: fmtDate, formatDateTime: fmtDateTime } })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('affiche les détails et émet close', async () => {
    const w = mount(AttendanceParticipationModal, { props: { attendance, formatDate: fmtDate, formatDateTime: fmtDateTime } })
    expect(w.find('.modal-overlay').exists()).toBe(true)
    expect(w.text()).toContain('aline@e.com')
    expect(w.text()).toContain('En cours') // left_at null → "En cours"
    await w.find('.modal-close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
