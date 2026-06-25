/**
 * Tests des fonctions pures de utils/classeDetails (#H9).
 * Formatage date/heure, duree et statut de fenetre d evaluation.
 */
import { describe, it, expect } from 'vitest'
import {
  formatDate, formatTime, calculateDuration,
  getEvaluationStatusClass, getEvaluationStatusLabel
} from '@/utils/classeDetails'

describe('classeDetails utils (#H9)', () => {
  it('formatDate retourne N/A si vide, sinon date fr', () => {
    expect(formatDate(null)).toBe('N/A')
    expect(formatDate('2026-03-15')).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('formatTime retourne N/A si vide, sinon HH:MM', () => {
    expect(formatTime(null)).toBe('N/A')
    expect(formatTime('2026-03-15T08:30:00')).toMatch(/\d{2}:\d{2}/)
  })

  it('calculateDuration calcule les minutes entre debut et fin', () => {
    const s = { programmation: { heure_debut: '2026-03-15T08:00:00', heure_fin: '2026-03-15T09:30:00' } }
    expect(calculateDuration(s)).toBe(90)
    expect(calculateDuration({ programmation: {} })).toBe(0)
  })

  it('getEvaluationStatusClass mappe les etats de fenetre', () => {
    expect(getEvaluationStatusClass(null)).toBe('bg-gray-100 text-gray-700')
    expect(getEvaluationStatusClass({ is_active: true })).toBe('bg-green-100 text-green-700')
    expect(getEvaluationStatusClass({ is_upcoming: true })).toBe('bg-blue-100 text-blue-700')
    expect(getEvaluationStatusClass({ is_past: true })).toBe('bg-gray-100 text-gray-700')
    expect(getEvaluationStatusClass({})).toBe('bg-yellow-100 text-yellow-700')
  })

  it('getEvaluationStatusLabel mappe les libelles', () => {
    expect(getEvaluationStatusLabel(null)).toBe('Non programmée')
    expect(getEvaluationStatusLabel({ is_active: true })).toBe('En cours')
    expect(getEvaluationStatusLabel({ is_upcoming: true, time_until_start: 'dans 2h' })).toBe('Ouvre dans 2h')
    expect(getEvaluationStatusLabel({ is_past: true })).toBe('Terminée')
    expect(getEvaluationStatusLabel({})).toBe('Programmée')
  })
})
