/**
 * Tests de la logique métier pure des présences (#28 — décomposition
 * SeanceAttendanceHistory.vue, tranche 1). Seuils 80/60 %, mappers, périodes.
 */
import { describe, it, expect } from 'vitest'
import {
  getAttendanceRateClass,
  getAttendanceStatusBadgeClass,
  getConnectionStatusClass,
  getConnectionStatusLabel,
  getPeriodDates
} from '@/utils/attendance'

describe('utils/attendance — getAttendanceRateClass (seuils 80/60)', () => {
  it('≥ 80 → rate-high', () => {
    expect(getAttendanceRateClass(80)).toBe('rate-high')
    expect(getAttendanceRateClass(100)).toBe('rate-high')
  })
  it('≥ 60 et < 80 → rate-medium', () => {
    expect(getAttendanceRateClass(60)).toBe('rate-medium')
    expect(getAttendanceRateClass(79)).toBe('rate-medium')
  })
  it('< 60 → rate-low', () => {
    expect(getAttendanceRateClass(59)).toBe('rate-low')
    expect(getAttendanceRateClass(0)).toBe('rate-low')
  })
})

describe('utils/attendance — getAttendanceStatusBadgeClass', () => {
  it('mappe chaque niveau', () => {
    expect(getAttendanceStatusBadgeClass('present')).toBe('status-badge status-present')
    expect(getAttendanceStatusBadgeClass('partial')).toBe('status-badge status-partial')
    expect(getAttendanceStatusBadgeClass('low')).toBe('status-badge status-low')
    expect(getAttendanceStatusBadgeClass('absent')).toBe('status-badge status-absent')
    expect(getAttendanceStatusBadgeClass('ongoing')).toBe('status-badge status-ongoing')
  })
  it('niveau inconnu → classe de base seule', () => {
    expect(getAttendanceStatusBadgeClass('xxx')).toBe('status-badge')
  })
})

describe('utils/attendance — état de connexion', () => {
  it('connected → en ligne / Connecté', () => {
    expect(getConnectionStatusClass('connected')).toBe('status-online')
    expect(getConnectionStatusLabel('connected')).toBe('Connecté')
  })
  it('autre → hors ligne / Déconnecté', () => {
    expect(getConnectionStatusClass('disconnected')).toBe('status-offline')
    expect(getConnectionStatusLabel('')).toBe('Déconnecté')
  })
})

describe('utils/attendance — getPeriodDates', () => {
  it('custom : reprend les dates fournies', () => {
    expect(getPeriodDates('custom', { from: '2026-01-01', to: '2026-01-31' }))
      .toEqual({ from: '2026-01-01', to: '2026-01-31' })
  })
  it('today : from === to, format YYYY-MM-DD', () => {
    const { from, to } = getPeriodDates('today')
    expect(from).toBe(to)
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('week/month : bornes valides YYYY-MM-DD, from <= to', () => {
    for (const period of ['week', 'month']) {
      const { from, to } = getPeriodDates(period)
      expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(from <= to).toBe(true)
    }
  })
  it('période inconnue : objet vide', () => {
    expect(getPeriodDates('annee')).toEqual({})
  })
})
