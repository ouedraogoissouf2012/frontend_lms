/**
 * Tests de la logique métier pure du calendrier (#28 — décomposition
 * UniversalCalendar.vue, tranche 1). Couleurs, urgence, bornes de date.
 */
import { describe, it, expect } from 'vitest'
import {
  determineSeanceColor,
  determineEvaluationColor,
  isEvaluationUrgent,
  getDateRangeStart,
  getDateRangeEnd
} from '@/utils/calendar'

describe('utils/calendar — determineSeanceColor', () => {
  it('mappe le statut visio vers la couleur', () => {
    expect(determineSeanceColor({ visio: { status: 'active' } })).toBe('#10b981')
    expect(determineSeanceColor({ visio: { status: 'programmee' } })).toBe('#3b82f6')
    expect(determineSeanceColor({ visio: { status: 'terminee' } })).toBe('#6b7280')
  })
  it('couleur LMS par défaut si pas de visio', () => {
    expect(determineSeanceColor({})).toBe('#2563eb')
    expect(determineSeanceColor({ visio: { status: 'inconnu' } })).toBe('#2563eb')
  })
})

describe('utils/calendar — isEvaluationUrgent', () => {
  it('false sans date', () => {
    expect(isEvaluationUrgent({})).toBe(false)
  })
  it('false si date invalide', () => {
    expect(isEvaluationUrgent({ date_evaluation: 'pas-une-date' })).toBe(false)
  })
  it('true si < 24 h dans le futur', () => {
    const inOneHour = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    expect(isEvaluationUrgent({ date_evaluation: inOneHour })).toBe(true)
  })
  it('false si > 24 h', () => {
    const inTwoDays = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    expect(isEvaluationUrgent({ date_evaluation: inTwoDays })).toBe(false)
  })
  it('false si déjà passée', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    expect(isEvaluationUrgent({ date_evaluation: yesterday })).toBe(false)
  })
  it('priorité à programmation.date_evaluation', () => {
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    expect(isEvaluationUrgent({ programmation: { date_evaluation: soon }, date_evaluation: '2000-01-01' })).toBe(true)
  })
})

describe('utils/calendar — determineEvaluationColor', () => {
  it('rouge si urgent, orange sinon', () => {
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    expect(determineEvaluationColor({ date_evaluation: soon })).toBe('#ef4444')
    expect(determineEvaluationColor({})).toBe('#ea580c')
  })
})

describe('utils/calendar — bornes de date', () => {
  const isoRe = /^\d{4}-\d{2}-\d{2}$/
  it('start : today/week/month/défaut au format YYYY-MM-DD', () => {
    for (const p of ['today', 'week', 'month', 'autre']) {
      expect(getDateRangeStart(p)).toMatch(isoRe)
    }
  })
  it('end : tous les présets au format YYYY-MM-DD', () => {
    for (const p of ['today', 'week', 'month', '7days', '30days', '90days', 'defaut']) {
      expect(getDateRangeEnd(p)).toMatch(isoRe)
    }
  })
  it('end 30days > today', () => {
    expect(getDateRangeEnd('30days') > getDateRangeEnd('today')).toBe(true)
  })
})
