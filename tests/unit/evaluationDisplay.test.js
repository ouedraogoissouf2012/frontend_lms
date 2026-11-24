/**
 * byId — index des lignes de référence (#296, puis #626). RENVERSÉ par #626 (déclaré) : `byId` indexait chaque ligne
 * par TOUTES les clés d'`ENTITY_ID_KEYS` ; or le même nombre peut être l'`id` d'une ligne et le `user_id` ou le
 * `klassci_id` (un numéro de COMPTE KLASSCI) d'une autre, d'un autre espace. Une ligne s'indexe désormais par son
 * `id` SEUL, l'identité que parlent l'annuaire et les évaluations d'une même école (lms_backend#873, #1396).
 */
import { describe, it, expect } from 'vitest'
import { byId } from '@/utils/evaluationDisplay'

describe('byId — index par l’id seul (#626)', () => {
  it('indexe une ligne par son id, et par rien d’autre', () => {
    const item = { id: 1, klassci_id: 7, class_id: 42 }
    const map = byId([item])
    expect(map.get('1')).toBe(item)
    expect(map.has('7')).toBe(false)
    expect(map.has('42')).toBe(false)
  })

  it('premier gagnant entre deux lignes de MÊME id ; une ligne sans id n’est pas indexée ; non-array → map vide', () => {
    const a = { id: 1, nom: 'A' }
    const b = { id: 1, nom: 'B' }
    expect(byId([a, b]).get('1')).toBe(a)
    expect(byId([{ klassci_id: 1 }]).size).toBe(0)
    expect(byId(null).size).toBe(0)
    expect(byId(undefined).size).toBe(0)
  })
})
