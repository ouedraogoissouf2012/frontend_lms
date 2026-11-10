/**
 * Le délai d'un nouvel essai, dit à un élève (décision de la superviseure) : pas de « N s ».
 * « 30 secondes » ; à partir de 60 s, la minute supérieure (« 1 minute », « 2 minutes ») ; absent,
 * au format date, ou hors bornes (1 à 3600 s) : « un instant ». Source : l'en-tête `Retry-After`.
 */
import { describe, it, expect } from 'vitest'
import { libelleDelai } from '@/utils/delaiReessai'

describe('libelleDelai (en-tête Retry-After)', () => {
  it.each([
    ['1', '1 seconde'],
    ['30', '30 secondes'],
    ['59', '59 secondes'],
    ['60', '1 minute'],
    ['61', '2 minutes'],
    ['3600', '60 minutes'],
  ])('%s s → « %s »', (entete, attendu) => {
    expect(libelleDelai(entete)).toBe(attendu)
  })

  it('absent, au format date, non entier ou hors bornes : « un instant »', () => {
    for (const entete of [undefined, null, '', '0', '3601', '99999', '-5', '1.5', 'abc', 'Wed, 21 Oct 2015 07:28:00 GMT']) {
      expect(libelleDelai(entete)).toBe('un instant')
    }
  })
})
