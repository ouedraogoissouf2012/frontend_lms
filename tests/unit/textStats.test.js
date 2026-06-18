/**
 * Tests des statistiques de texte (#28 — TipTapEditor.vue).
 */
import { describe, it, expect } from 'vitest'
import { countWords, countCharacters } from '@/utils/textStats'

describe('utils/textStats — countWords', () => {
  it('compte les mots séparés par des espaces', () => {
    expect(countWords('bonjour le monde')).toBe(3)
  })
  it('ignore les espaces multiples et bords', () => {
    expect(countWords('  un   deux  ')).toBe(2)
  })
  it('0 si vide', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
    expect(countWords(null)).toBe(0)
  })
})

describe('utils/textStats — countCharacters', () => {
  it('compte les caractères', () => {
    expect(countCharacters('abc')).toBe(3)
  })
  it('0 si vide ou null', () => {
    expect(countCharacters('')).toBe(0)
    expect(countCharacters(null)).toBe(0)
  })
})
