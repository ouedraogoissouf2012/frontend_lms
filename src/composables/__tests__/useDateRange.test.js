/**
 * Tests du composable useDateRange (#23) — src/composables/useDateRange.js
 *
 * Logique STATEFUL de plage de dates : période sélectionnée réactive + bornes
 * dérivées en heure LOCALE (corrige le bug toISOString UTC qui décale le jour).
 * Horloge figée (vi.setSystemTime) pour un déterminisme total.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDateRange } from '@/composables/useDateRange'

// Lundi 15 juin 2026, 14:30 (heure locale)
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 5, 15, 14, 30, 0))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useDateRange — presets (bornes locales)', () => {
  it('today → jour courant', () => {
    const { start, end } = useDateRange({ initialPeriod: 'today' })
    expect(start.value).toBe('2026-06-15')
    expect(end.value).toBe('2026-06-15')
  })

  it('week (lundi par défaut) → lundi..dimanche', () => {
    const { start, end } = useDateRange({ initialPeriod: 'week' })
    expect(start.value).toBe('2026-06-15') // lundi
    expect(end.value).toBe('2026-06-21') // dimanche
  })

  it('week override weekStartsOn:0 → dimanche..samedi', () => {
    const { start, end } = useDateRange({ initialPeriod: 'week', weekStartsOn: 0 })
    expect(start.value).toBe('2026-06-14') // dimanche
    expect(end.value).toBe('2026-06-20')
  })

  it('month → 1er..dernier jour du mois', () => {
    const { start, end } = useDateRange({ initialPeriod: 'month' })
    expect(start.value).toBe('2026-06-01')
    expect(end.value).toBe('2026-06-30')
  })

  it('7days / 30days / 90days → N derniers jours jusqu\'à aujourd\'hui', () => {
    expect(useDateRange({ initialPeriod: '7days' }).start.value).toBe('2026-06-09')
    expect(useDateRange({ initialPeriod: '30days' }).start.value).toBe('2026-05-17')
    expect(useDateRange({ initialPeriod: '90days' }).start.value).toBe('2026-03-18')
    expect(useDateRange({ initialPeriod: '7days' }).end.value).toBe('2026-06-15')
  })
})

describe('useDateRange — anti-décalage de jour (bug UTC corrigé)', () => {
  it('proche de minuit local → jour LOCAL, pas le jour UTC', () => {
    vi.setSystemTime(new Date(2026, 5, 15, 23, 30, 0)) // 23h30 local
    const { start } = useDateRange({ initialPeriod: 'today' })
    expect(start.value).toBe('2026-06-15') // jour local conservé
  })
})

describe('useDateRange — réactivité et custom', () => {
  it('setPeriod recalcule start/end automatiquement', () => {
    const { start, end, setPeriod } = useDateRange({ initialPeriod: 'today' })
    expect(start.value).toBe('2026-06-15')
    setPeriod('month')
    expect(start.value).toBe('2026-06-01')
    expect(end.value).toBe('2026-06-30')
  })

  it('custom → bornes fournies', () => {
    const { start, end, setCustomRange } = useDateRange({ initialPeriod: 'month' })
    setCustomRange('2026-06-01', '2026-06-15')
    expect(start.value).toBe('2026-06-01')
    expect(end.value).toBe('2026-06-15')
  })

  it('custom sans bornes → repli sûr (month), jamais undefined', () => {
    const { start, setPeriod } = useDateRange({ initialPeriod: 'month' })
    setPeriod('custom')
    expect(start.value).toBe('2026-06-01') // repli month
    expect(start.value).not.toBeUndefined()
  })

  it('expose la liste des presets', () => {
    const { presets } = useDateRange()
    expect(presets).toContain('week')
    expect(presets).toContain('custom')
  })
})
