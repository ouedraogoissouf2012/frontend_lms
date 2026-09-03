import { describe, it, expect } from 'vitest'
import { toId } from '@/utils/toId'

describe('toId — normalisation d\'id KLASSCI', () => {
  it('unifie number et string', () => {
    expect(toId(12)).toBe('12')
    expect(toId('12')).toBe('12')
    expect(toId(12)).toBe(toId('12'))
  })

  it('extrait l\'id d\'un objet KLASSCI', () => {
    expect(toId({ id: 12 })).toBe('12')
    expect(toId({ klassci_id: '12' })).toBe('12')
    expect(toId({ classe_id: 12 })).toBe('12')
    expect(toId({ class_id: '12' })).toBe('12')
  })

  it('objet multi-clés : précédence par ENTITY_ID_KEYS (id avant les clés étrangères)', () => {
    expect(toId({ id: 1, klassci_id: 2, classe_id: 3 })).toBe('1')
    expect(toId({ klassci_id: 2, classe_id: 3 })).toBe('2')
    // clé null/absente ignorée (parité `??`) → passe à la suivante
    expect(toId({ id: null, klassci_id: 5 })).toBe('5')
  })

  it('renvoie une chaîne vide pour les valeurs vides', () => {
    expect(toId(null)).toBe('')
    expect(toId(undefined)).toBe('')
    expect(toId('')).toBe('')
  })
})
