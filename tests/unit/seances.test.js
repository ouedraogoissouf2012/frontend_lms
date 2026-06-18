/**
 * Tests de la logique pure des séances (#28 — décomposition TeacherSeances.vue).
 */
import { describe, it, expect } from 'vitest'
import { filterSeances, computeSeancesStats } from '@/utils/seances'

const S = (over = {}) => ({ matiere: { id: 1 }, visio: { enabled: true, status: 'programmee' }, ...over })

describe('utils/seances — filterSeances', () => {
  const data = [
    S({ matiere: { id: 1 }, visio: { enabled: true, status: 'active' } }),
    S({ matiere: { id: 2 }, visio: { enabled: true, status: 'programmee' } }),
    S({ matiere: { id: 2 }, visio: null })
  ]
  it('filtre par matière (comparaison souple)', () => {
    expect(filterSeances(data, { matiere_id: '2' })).toHaveLength(2)
  })
  it('filtre par statut visio', () => {
    expect(filterSeances(data, { visio_status: 'active' })).toHaveLength(1)
  })
  it('statut "none" = sans visio activée', () => {
    expect(filterSeances(data, { visio_status: 'none' })).toHaveLength(1)
  })
  it('period "all" ou absente : pas de filtre temporel', () => {
    expect(filterSeances(data, { period: 'all' })).toHaveLength(3)
    expect(filterSeances(data, {})).toHaveLength(3)
  })
  it('period "today" garde la séance du jour, exclut une date passée', () => {
    const today = new Date().toISOString()
    const seances = [
      S({ programmation: { date: today } }),
      S({ programmation: { date: '2000-01-01' } }),
      S({ programmation: {} }) // pas de date → exclue
    ]
    expect(filterSeances(seances, { period: 'today' })).toHaveLength(1)
  })
})

describe('utils/seances — computeSeancesStats', () => {
  it('compte par statut visio', () => {
    const data = [
      S({ visio: { status: 'active' } }),
      S({ visio: { status: 'programmee' } }),
      S({ visio: { status: 'terminee' } }),
      S({ visio: { status: 'active' } })
    ]
    expect(computeSeancesStats(data)).toEqual({ total: 4, active: 2, scheduled: 1, finished: 1 })
  })
})
