/**
 * #296 — coalesceNumber / coalesceNumberFrom : source unique des 5 coalesceurs
 * « premier nombre fini ». Vérifie la précédence, l'ignorance de null/undefined/'',
 * le repli configurable, et la lecture par chemins pointés.
 */
import { describe, it, expect } from 'vitest'
import { coalesceNumber, coalesceNumberFrom } from '@/utils/coalesceNumber'

describe('coalesceNumber (#296)', () => {
  it('retourne le premier nombre fini dans l\'ordre', () => {
    expect(coalesceNumber([null, undefined, 5, 9])).toBe(5)
    expect(coalesceNumber(['12', 3])).toBe(12) // les chaînes numériques comptent
  })

  it('IGNORE null/undefined/chaîne vide (pas de 0 fabriqué)', () => {
    expect(coalesceNumber([null, 7])).toBe(7)
    expect(coalesceNumber([undefined, 7])).toBe(7)
    expect(coalesceNumber(['', 7])).toBe(7) // '' n'est PAS un 0
  })

  it('distingue un 0 mesuré d\'une absence', () => {
    expect(coalesceNumber([0, 7])).toBe(0) // 0 explicite est une mesure valide
  })

  it('repli par défaut = null, ou la valeur fournie', () => {
    expect(coalesceNumber([null, undefined])).toBe(null)
    expect(coalesceNumber([], 0)).toBe(0)
    expect(coalesceNumber(['x', NaN], 0)).toBe(0) // NaN/non-numérique ignorés
  })

  it('ignore les valeurs non convertibles en nombre fini', () => {
    expect(coalesceNumber(['abc', {}, 4])).toBe(4) // NaN (chaîne/objet) ignoré
  })

  describe('coalesceNumberFrom — chemins pointés', () => {
    it('lit les chemins dans l\'ordre de précédence', () => {
      const src = { a: null, stats: { total: 42 }, b: 3 }
      expect(coalesceNumberFrom(src, ['a', 'stats.total', 'b'])).toBe(42)
    })

    it('supporte les chemins profonds absents sans jeter', () => {
      const src = { x: 1 }
      expect(coalesceNumberFrom(src, ['deep.missing.path', 'x'])).toBe(1)
    })

    it('applique le repli fourni si aucun chemin ne donne un nombre', () => {
      expect(coalesceNumberFrom({}, ['a', 'b.c'], 0)).toBe(0)
      expect(coalesceNumberFrom({}, ['a'])).toBe(null)
    })
  })
})
