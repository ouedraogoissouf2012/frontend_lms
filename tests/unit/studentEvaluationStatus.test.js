/**
 * Test des helpers purs studentEvaluationStatus (H2) : fenêtre (KLASSCI + fallback
 * date), libellés/classes de statut, classe de note, formats. Cas déterministes
 * (fenêtre explicite) pour éviter toute dépendance à l'horloge.
 */
import { describe, it, expect } from 'vitest'
import {
  isExpired,
  isWindowOpen,
  getStatusLabel,
  getStatusClass,
  getWindowClass,
  getNoteClass,
  formatDate,
  formatDateTime,
} from '@/utils/studentEvaluationStatus'

describe('isExpired / isWindowOpen (fenêtre KLASSCI)', () => {
  it('fenêtre démarrée mais fermée → expirée, non ouverte', () => {
    const e = { programmation: { window: { has_started: true, is_open: false } } }
    expect(isExpired(e)).toBe(true)
    expect(isWindowOpen(e)).toBe(false)
  })

  it('fenêtre ouverte → non expirée, ouverte', () => {
    const e = { programmation: { window: { has_started: true, is_open: true } } }
    expect(isExpired(e)).toBe(false)
    expect(isWindowOpen(e)).toBe(true)
  })

  it('sans fenêtre ni date → non expirée et toujours ouverte', () => {
    expect(isExpired({})).toBe(false)
    expect(isWindowOpen({})).toBe(true)
  })
})

describe('getStatusLabel / getStatusClass', () => {
  it('soumission en cours → « En cours » / status-ongoing', () => {
    const e = { student_submission: { status: 'en_cours' } }
    expect(getStatusLabel(e)).toBe('En cours')
    expect(getStatusClass(e)).toBe('status-ongoing')
  })

  it('fenêtre ouverte → « Disponible » / status-active', () => {
    const e = { programmation: { window: { has_started: true, is_open: true } } }
    expect(getStatusLabel(e)).toBe('Disponible')
    expect(getStatusClass(e)).toBe('status-active')
  })

  it('sinon → « Programmée » / status-planned', () => {
    const e = { programmation: { window: { has_started: false, is_open: false } } }
    expect(getStatusLabel(e)).toBe('Programmée')
    expect(getStatusClass(e)).toBe('status-planned')
  })
})

describe('getWindowClass', () => {
  it('mappe pending / open / closed et vide sans fenêtre', () => {
    expect(getWindowClass({})).toBe('')
    expect(getWindowClass({ programmation: { window: { has_started: false } } })).toBe('window-pending')
    expect(getWindowClass({ programmation: { window: { has_started: true, is_open: true } } })).toBe('window-open')
    expect(getWindowClass({ programmation: { window: { has_started: true, is_open: false } } })).toBe('window-closed')
  })
})

describe('getNoteClass', () => {
  it('mappe les paliers de note', () => {
    expect(getNoteClass(null)).toBe('')
    expect(getNoteClass(undefined)).toBe('')
    expect(getNoteClass(18)).toBe('note-excellent')
    expect(getNoteClass(15)).toBe('note-good')
    expect(getNoteClass(11)).toBe('note-average')
    expect(getNoteClass(5)).toBe('note-low')
  })
})

describe('formatDate / formatDateTime', () => {
  it('renvoie les fallbacks sur valeur vide', () => {
    expect(formatDate(null)).toBe('Non définie')
    expect(formatDateTime(null)).toBe('')
  })

  it('formate une date valide (fr-FR)', () => {
    expect(formatDate('2026-03-15T10:30:00')).toContain('2026')
    expect(formatDateTime('2026-03-15T10:30:00')).toContain('2026')
  })
})
