/**
 * Lot « Réessayer », PR B1 : trois composants qui offraient « Réessayer » sans condition prennent
 * une prop `canRetry` (vraie par défaut, pour ne rien changer aux usages qui ne la passent pas).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal.vue'
import LoadRetryNotice from '@/components/lessons/LoadRetryNotice.vue'
import CoursesLoadMore from '@/components/student/CoursesLoadMore.vue'

const reessayer = (w) => w.findAll('button').filter((b) => /R[ée]essayer/.test(b.text()))

describe('AttendanceDetailModal — Réessayer selon canRetry', () => {
  const props = { selectedSeance: { id: 1 }, attendances: null, loadingAttendances: false, attendancesError: 'Erreur' }
  it('par défaut : Réessayer ; canRetry faux : le message reste, sans Réessayer', () => {
    expect(reessayer(mount(AttendanceDetailModal, { props }))).toHaveLength(1)
    const refus = mount(AttendanceDetailModal, { props: { ...props, canRetry: false } })
    expect(refus.text()).toContain('Erreur')
    expect(reessayer(refus)).toHaveLength(0)
  })
})

describe('LoadRetryNotice — Réessayer selon canRetry', () => {
  it('par défaut : Réessayer ; canRetry faux : le message reste, sans Réessayer', () => {
    expect(reessayer(mount(LoadRetryNotice, { props: { message: 'Chapitres illisibles' } }))).toHaveLength(1)
    const refus = mount(LoadRetryNotice, { props: { message: 'Chapitres illisibles', canRetry: false } })
    expect(refus.text()).toContain('Chapitres illisibles')
    expect(reessayer(refus)).toHaveLength(0)
  })
})

describe('CoursesLoadMore — Réessayer selon canRetry, « Charger plus » intact', () => {
  const base = { shown: 15, total: 18, hasMore: true, loading: false, error: null }
  it('sans erreur : « Charger plus » (même avec canRetry faux)', () => {
    const w = mount(CoursesLoadMore, { props: { ...base, canRetry: false } })
    expect(w.text()).toMatch(/Charger plus/)
  })
  it('erreur et panne : Réessayer ; erreur et refus : le message, sans bouton', () => {
    expect(reessayer(mount(CoursesLoadMore, { props: { ...base, error: 'Page 2 illisible' } }))).toHaveLength(1)
    const refus = mount(CoursesLoadMore, { props: { ...base, error: 'Page 2 illisible', canRetry: false } })
    expect(refus.text()).toContain('Page 2 illisible')
    expect(reessayer(refus)).toHaveLength(0)
  })
})
