/**
 * byId — index KLASSCI (#296). Vérifie que byId indexe chaque item par TOUTES ses
 * clés d'identité (la MÊME liste `ENTITY_ID_KEYS` que `toId`), et notamment
 * `class_id` — jadis oublié ici, ce qui faisait diverger les deux copies de la liste.
 */
import { describe, it, expect } from 'vitest'
import { byId } from '@/utils/evaluationDisplay'
import { ENTITY_ID_KEYS } from '@/utils/toId'

describe('byId — index KLASSCI (#296)', () => {
  it('indexe un item par id, klassci_id ET class_id (jadis oublié)', () => {
    const item = { id: 1, klassci_id: 7, class_id: 42 }
    const map = byId([item])
    expect(map.get('1')).toBe(item)
    expect(map.get('7')).toBe(item)
    expect(map.get('42')).toBe(item) // régression corrigée : class_id désormais indexé
  })

  it('partage la MÊME liste de clés que toId (0 divergence) : indexe chacune', () => {
    const item = Object.fromEntries(ENTITY_ID_KEYS.map((k, i) => [k, 100 + i]))
    const map = byId([item])
    ENTITY_ID_KEYS.forEach((_, i) => expect(map.get(String(100 + i))).toBe(item))
  })

  it('premier gagnant en cas de collision de clé ; non-array → map vide', () => {
    const a = { id: 1 }
    const b = { klassci_id: 1 } // même clé normalisée '1'
    expect(byId([a, b]).get('1')).toBe(a) // premier inséré gagne (garde !map.has)
    expect(byId(null).size).toBe(0)
    expect(byId(undefined).size).toBe(0)
  })
})
