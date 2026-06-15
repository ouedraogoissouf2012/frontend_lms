/**
 * Tests des formatters centralisés (#23) — src/utils/formatters.js
 *
 * Fonctions PURES de formatage : dates (variantes), heure, durées, initiales,
 * troncature. Couvre happy path + cas limites (null/invalide → repli sûr `'—'`,
 * surchargeable) — aucune fuite `'Invalid Date'`/`'NaN'`.
 */
import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatDateLong,
  formatDateWeekday,
  formatDateShort,
  formatTime,
  formatDateInput,
  formatDuration,
  formatElapsed,
  getInitials,
  truncate,
  truncateText,
} from '@/utils/formatters'

// Lundi 15 juin 2026, 14:30 (heure locale)
const DATE = new Date(2026, 5, 15, 14, 30, 0)
const ISO = '2026-06-15T14:30:00'

describe('formatters — dates', () => {
  it('formatDate → JJ/MM/AAAA (fr-FR)', () => {
    expect(formatDate(DATE)).toBe('15/06/2026')
    expect(formatDate(ISO)).toBe('15/06/2026')
  })

  it('formatDate — repli unique sur valeur nulle/invalide, jamais Invalid Date', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('pas-une-date')).toBe('—')
    expect(formatDate('pas-une-date')).not.toContain('Invalid')
  })

  it('formatDate — repli surchargeable', () => {
    expect(formatDate(null, { fallback: 'Non définie' })).toBe('Non définie')
    expect(formatDate(null, { fallback: '-' })).toBe('-')
  })

  it('formatDateTime → JJ/MM/AAAA HH:mm', () => {
    expect(formatDateTime(DATE)).toBe('15/06/2026 14:30')
    expect(formatDateTime(null)).toBe('—')
  })

  it('formatDateLong → 15 juin 2026', () => {
    expect(formatDateLong(DATE)).toBe('15 juin 2026')
    expect(formatDateLong('x')).toBe('—')
  })

  it('formatDateWeekday → lundi 15 juin 2026', () => {
    expect(formatDateWeekday(DATE)).toBe('lundi 15 juin 2026')
  })

  it('formatDateShort → format court', () => {
    // 2-digit/short/numeric : « 15 juin 2026 » court — on vérifie au minimum la non-régression
    expect(formatDateShort(DATE)).toContain('15')
    expect(formatDateShort(null)).toBe('—')
  })

  it('formatTime → HH:mm (heure du jour)', () => {
    expect(formatTime(DATE)).toBe('14:30')
    expect(formatTime(null)).toBe('—')
  })

  it('formatDateInput → YYYY-MM-DD en heure LOCALE (pas toISOString)', () => {
    expect(formatDateInput(DATE)).toBe('2026-06-15')
    // Proche de minuit local : doit rester le jour local
    expect(formatDateInput(new Date(2026, 5, 15, 23, 30))).toBe('2026-06-15')
  })

  it('formatDate — déterminisme', () => {
    expect(formatDate(DATE)).toBe(formatDate(DATE))
  })
})

describe('formatters — durées', () => {
  it('formatDuration(minutes) → Xh Ymin', () => {
    expect(formatDuration(150)).toBe('2h 30min')
    expect(formatDuration(45)).toBe('45min')
    expect(formatDuration(120)).toBe('2h')
  })

  it('formatDuration — repli sur 0/null/NaN, jamais NaN', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(NaN)).toBe('—')
    expect(formatDuration(0)).toBe('—')
    expect(formatDuration(null)).not.toContain('NaN')
  })

  it('formatElapsed(seconds) → mm:ss avec padding', () => {
    expect(formatElapsed(65)).toBe('1:05')
    expect(formatElapsed(5)).toBe('0:05')
    expect(formatElapsed(0)).toBe('0:00')
    expect(formatElapsed(125)).toBe('2:05')
  })

  it('formatElapsed — négatif/NaN → repli sûr, jamais NaN:NaN', () => {
    expect(formatElapsed(-1)).toBe('0:00')
    expect(formatElapsed(NaN)).toBe('0:00')
  })
})

describe('formatters — getInitials (polymorphe)', () => {
  it('chaîne nom complet → 2 initiales', () => {
    expect(getInitials('Jean Dupont')).toBe('JD')
  })

  it('nom unique → 2 premières lettres', () => {
    expect(getInitials('Jean')).toBe('JE')
  })

  it('objet {prenom, nom} → initiales', () => {
    expect(getInitials({ prenom: 'Jean', nom: 'Dupont' })).toBe('JD')
  })

  it('objet {name} → initiales', () => {
    expect(getInitials({ name: 'Marie Curie' })).toBe('MC')
  })

  it('vide/null/{} → repli ?', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials(null)).toBe('?')
    expect(getInitials({})).toBe('?')
  })
})

describe('formatters — truncate', () => {
  it('tronque + ellipse si trop long', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcde…')
  })

  it('inchangé si court', () => {
    expect(truncate('abc', 5)).toBe('abc')
  })

  it('vide → vide', () => {
    expect(truncate('', 5)).toBe('')
    expect(truncate(null, 5)).toBe('')
  })

  it('truncateText est un alias identique', () => {
    expect(truncateText('abcdefghij', 5)).toBe(truncate('abcdefghij', 5))
  })
})
