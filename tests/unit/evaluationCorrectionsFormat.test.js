/**
 * Test des helpers purs evaluationCorrectionsFormat (H2) : formats de date,
 * initiales, classes/libellés de note et de statut. Logique extraite verbatim
 * de EvaluationCorrections.vue.
 */
import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  getInitials,
  getNoteClass,
  getStatusClass,
  getStatusLabel,
} from '@/utils/evaluationCorrectionsFormat'

describe('formatDate / formatDateTime', () => {
  it('renvoie les fallbacks sur valeur vide', () => {
    expect(formatDate(null)).toBe('Non définie')
    expect(formatDateTime(null)).toBe('-')
  })
  it('formate une date valide', () => {
    expect(formatDate('2026-03-15T10:30:00')).toContain('2026')
    expect(formatDateTime('2026-03-15T10:30:00')).toContain('2026')
  })
})

describe('getInitials', () => {
  it('déduit les initiales', () => {
    expect(getInitials('Marie Curie')).toBe('MC')
    expect(getInitials('Platon')).toBe('PL')
    expect(getInitials('')).toBe('?')
    expect(getInitials(null)).toBe('?')
  })
})

describe('getNoteClass', () => {
  it('mappe les paliers de note', () => {
    expect(getNoteClass(18)).toBe('note-excellent')
    expect(getNoteClass(15)).toBe('note-good')
    expect(getNoteClass(11)).toBe('note-average')
    expect(getNoteClass(5)).toBe('note-low')
  })
})

describe('getStatusClass / getStatusLabel', () => {
  it('mappe statut → classe', () => {
    expect(getStatusClass('soumis')).toBe('status-submitted')
    expect(getStatusClass('corrige')).toBe('status-corrected')
    expect(getStatusClass('en_cours')).toBe('status-ongoing')
    expect(getStatusClass('non_passee')).toBe('status-not-taken')
    expect(getStatusClass('???')).toBe('status-default')
  })
  it('mappe statut → libellé', () => {
    expect(getStatusLabel('soumis')).toBe('Soumis')
    expect(getStatusLabel('corrige')).toBe('Corrigé')
    expect(getStatusLabel('en_cours')).toBe('En cours')
    expect(getStatusLabel('non_passee')).toBe('Non passée')
    expect(getStatusLabel('autre')).toBe('autre')
  })
})
