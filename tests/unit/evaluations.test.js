/**
 * Tests de la logique métier pure des évaluations (#28 — décomposition
 * TeacherEvaluations.vue, tranche 1). Parité comportementale avec la vue.
 */
import { describe, it, expect } from 'vitest'
import {
  mergeWithOnlineVersions,
  isExpiredWithoutOnline,
  filterEvaluations,
  computeEvaluationStats,
  getStatusLabel,
  getStatusTooltip,
  getStatusBadgeClass
} from '@/utils/evaluations'

describe('utils/evaluations — mergeWithOnlineVersions', () => {
  it('associe la version LMS en ligne par klassci_evaluation_id', () => {
    const klassci = [{ id: 1 }, { id: 2 }]
    const lms = [{ id: 99, klassci_evaluation_id: 2 }]
    const merged = mergeWithOnlineVersions(klassci, lms)
    expect(merged[0]).toMatchObject({ id: 1, has_online: false })
    expect(merged[0].online_version).toBeUndefined()
    expect(merged[1]).toMatchObject({ id: 2, has_online: true })
    expect(merged[1].online_version).toEqual({ id: 99, klassci_evaluation_id: 2 })
  })

  it('renvoie [] si pas de klassci', () => {
    expect(mergeWithOnlineVersions([], [])).toEqual([])
  })
})

describe('utils/evaluations — isExpiredWithoutOnline', () => {
  it('false si version en ligne existe', () => {
    expect(isExpiredWithoutOnline({ has_online: true, date_evaluation: '2000-01-01' })).toBe(false)
  })

  it('true si fenêtre fermée et démarrée, sans version en ligne', () => {
    expect(isExpiredWithoutOnline({
      has_online: false,
      programmation: { window: { is_open: false, has_started: true } }
    })).toBe(true)
  })

  it('true si date_evaluation passée', () => {
    expect(isExpiredWithoutOnline({ has_online: false, date_evaluation: '2000-01-01' })).toBe(true)
  })

  it('false si date_evaluation future', () => {
    expect(isExpiredWithoutOnline({ has_online: false, date_evaluation: '2999-01-01' })).toBe(false)
  })

  it('priorité à programmation.date_evaluation sur date_evaluation', () => {
    expect(isExpiredWithoutOnline({
      has_online: false,
      programmation: { date_evaluation: '2999-01-01' },
      date_evaluation: '2000-01-01'
    })).toBe(false)
  })

  it('false si aucune info d\'expiration', () => {
    expect(isExpiredWithoutOnline({ has_online: false })).toBe(false)
  })
})

describe('utils/evaluations — filterEvaluations', () => {
  const evals = [
    { id: 1, has_online: true, status: 'en_cours', classe: { id: 10 }, matiere: { id: 20 } },
    { id: 2, has_online: false, status: 'terminee', date_evaluation: '2000-01-01', classe: { id: 11 }, matiere: { id: 21 } },
    { id: 3, has_online: true, status: 'planifiee', classe: { id: 10 }, matiere: { id: 21 } }
  ]

  it('masque les expirées sans version en ligne quand hideExpired', () => {
    const out = filterEvaluations(evals, { hideExpired: true })
    expect(out.map(e => e.id)).toEqual([1, 3])
  })

  it('garde tout si hideExpired=false', () => {
    expect(filterEvaluations(evals, { hideExpired: false })).toHaveLength(3)
  })

  it('filtre par classe (comparaison souple)', () => {
    const out = filterEvaluations(evals, { hideExpired: false, classe_id: '10' })
    expect(out.map(e => e.id)).toEqual([1, 3])
  })

  it('filtre par matière et statut', () => {
    expect(filterEvaluations(evals, { hideExpired: false, matiere_id: 21 }).map(e => e.id)).toEqual([2, 3])
    expect(filterEvaluations(evals, { hideExpired: false, statut: 'terminee' }).map(e => e.id)).toEqual([2])
  })
})

describe('utils/evaluations — computeEvaluationStats', () => {
  it('compte total / enCours / terminees / avecVersionEnLigne', () => {
    const evals = [
      { has_online: true, status: 'en_cours', programmation: { window: { is_open: true } } },
      { has_online: false, status: 'terminee' },
      { has_online: true, status: 'planifiee' }
    ]
    expect(computeEvaluationStats(evals)).toEqual({
      total: 3, enCours: 1, terminees: 1, avecVersionEnLigne: 2
    })
  })
})

describe('utils/evaluations — mappers de statut', () => {
  it('getStatusLabel mappe + fallback brut', () => {
    expect(getStatusLabel('en_cours')).toBe('En cours')
    expect(getStatusLabel('completed')).toBe('Terminée')
    expect(getStatusLabel('inconnu')).toBe('inconnu')
  })

  it('getStatusTooltip a un fallback', () => {
    expect(getStatusTooltip('planifiee')).toContain('KLASSCI')
    expect(getStatusTooltip('xxx')).toBe("Statut de l'évaluation")
  })

  it('getStatusBadgeClass : fenêtre ouverte → active', () => {
    expect(getStatusBadgeClass({ programmation: { window: { is_open: true } }, status: 'terminee' }))
      .toBe('status-badge status-badge-active')
    expect(getStatusBadgeClass({ status: 'terminee' })).toBe('status-badge status-badge-finished')
    expect(getStatusBadgeClass({ status: 'xxx' })).toBe('status-badge status-badge-default')
  })
})
