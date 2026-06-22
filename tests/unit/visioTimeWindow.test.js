/**
 * Tests de la logique temporelle pure de la visio (utils/visioTimeWindow.js, G8).
 * Fenêtre : -15 min avant heure_debut → +30 min après heure_fin.
 * Calculs relatifs (Dates comparées par instant) → indépendants du fuseau horaire.
 */
import { describe, it, expect } from 'vitest'
import { formatVisioTime, isInTimeWindow, timeWindowMessage } from '@/utils/visioTimeWindow'

const MIN = 60 * 1000
const at = (ms) => new Date(ms).toISOString()

describe('utils/visioTimeWindow — formatVisioTime', () => {
  it("retourne 'N/A' si absent", () => {
    expect(formatVisioTime(null)).toBe('N/A')
    expect(formatVisioTime(undefined)).toBe('N/A')
  })
  it('formate en HH:MM', () => {
    expect(formatVisioTime('2025-10-20T09:05:00.000Z')).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('utils/visioTimeWindow — isInTimeWindow', () => {
  it('false si programmation incomplète', () => {
    expect(isInTimeWindow({ programmation: {} }, new Date())).toBe(false)
    expect(isInTimeWindow({}, new Date())).toBe(false)
  })
  it('true à l’intérieur de la fenêtre (-15min/+30min)', () => {
    const now = 1_000_000_000_000
    const seance = { programmation: { heure_debut: at(now + 5 * MIN), heure_fin: at(now + 60 * MIN) } }
    expect(isInTimeWindow(seance, new Date(now))).toBe(true) // début-15min déjà passé
  })
  it('false avant l’ouverture (> 15min avant le début)', () => {
    const now = 1_000_000_000_000
    const seance = { programmation: { heure_debut: at(now + 30 * MIN), heure_fin: at(now + 90 * MIN) } }
    expect(isInTimeWindow(seance, new Date(now))).toBe(false)
  })
  it('false après la fermeture (> 30min après la fin)', () => {
    const now = 1_000_000_000_000
    const seance = { programmation: { heure_debut: at(now - 120 * MIN), heure_fin: at(now - 31 * MIN) } }
    expect(isInTimeWindow(seance, new Date(now))).toBe(false)
  })
})

describe('utils/visioTimeWindow — timeWindowMessage', () => {
  it("'' si pas d’heure de début", () => {
    expect(timeWindowMessage({ programmation: {} }, new Date())).toBe('')
  })
  it("'maintenant' une fois la fenêtre ouverte", () => {
    const now = 1_000_000_000_000
    const seance = { programmation: { heure_debut: at(now + 5 * MIN) } }
    expect(timeWindowMessage(seance, new Date(now))).toBe('maintenant')
  })
  it("'dans X minutes' quand < 1h avant l’ouverture", () => {
    const now = 1_000_000_000_000
    // ouverture = debut-15min ; on veut ~10min avant l'ouverture → debut = now+25min
    const seance = { programmation: { heure_debut: at(now + 25 * MIN) } }
    expect(timeWindowMessage(seance, new Date(now))).toBe('dans 10 minutes')
  })
  it("'dans Xh Ymin' quand > 1h avant l’ouverture", () => {
    const now = 1_000_000_000_000
    // ouverture = debut-15min ; on veut 1h10 avant → debut = now+85min
    const seance = { programmation: { heure_debut: at(now + 85 * MIN) } }
    expect(timeWindowMessage(seance, new Date(now))).toBe('dans 1h 10min')
  })
})
