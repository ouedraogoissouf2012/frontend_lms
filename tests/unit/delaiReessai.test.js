/**
 * Le délai d'un nouvel essai, dit à un élève (décisions de la superviseure) : pas de « N s ».
 * - moins d'une minute : « dans 30 secondes » (« dans 1 seconde » au singulier) ;
 * - de 60 s à 60 min : la minute supérieure (« dans 1 minute », « dans 2 minutes ») ;
 * - au-delà de 60 min : l'heure supérieure (« dans 2 heures ») ;
 * - au-delà de 24 h : « plus tard ».
 * « Dans un instant » est réservé à un délai ABSENT ou ILLISIBLE : un long délai ne doit pas pousser
 * à réessayer trop tôt (le délai KLASSCI est réglable côté serveur, sans maximum).
 * Source : l'en-tête `Retry-After`, sa seule forme « nombre de secondes ».
 */
import { describe, it, expect } from 'vitest'
import { libelleDelai } from '@/utils/delaiReessai'

describe('libelleDelai (en-tête Retry-After)', () => {
  it.each([
    ['1', 'dans 1 seconde'],
    ['30', 'dans 30 secondes'],
    ['59', 'dans 59 secondes'],
    ['60', 'dans 1 minute'],
    ['61', 'dans 2 minutes'],
    ['3600', 'dans 60 minutes'],
    ['3601', 'dans 2 heures'],
    ['7200', 'dans 2 heures'],
    ['86400', 'dans 24 heures'],
    ['86401', 'plus tard'],
  ])('%s s → « %s »', (entete, attendu) => {
    expect(libelleDelai(entete)).toBe(attendu)
  })

  it('absent, au format date, nul, négatif ou non entier : « dans un instant »', () => {
    for (const entete of [undefined, null, '', '0', '-5', '1.5', 'abc', 'Wed, 21 Oct 2015 07:28:00 GMT']) {
      expect(libelleDelai(entete)).toBe('dans un instant')
    }
  })
})
