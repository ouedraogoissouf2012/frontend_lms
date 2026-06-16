import { describe, it, expect } from 'vitest'
import { UPLOAD_CONFIG, ACCEPTED_FILE_TYPES } from '@/constants/upload'

describe('constants/upload (#24)', () => {
  it('U1 — objets gelés', () => {
    expect(Object.isFrozen(UPLOAD_CONFIG)).toBe(true)
    expect(Object.isFrozen(ACCEPTED_FILE_TYPES)).toBe(true)
  })

  it('U2 — taille max 30 MB en octets', () => {
    expect(UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES).toBe(31457280)
  })

  it('U3 — libellé cohérent avec la taille', () => {
    expect(UPLOAD_CONFIG.MAX_FILE_SIZE_LABEL).toBe(
      `${UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
    )
  })

  it('types acceptés (recopie du mapping existant)', () => {
    expect(ACCEPTED_FILE_TYPES.powerpoint).toBe('.pptx,.ppt')
    expect(ACCEPTED_FILE_TYPES.word).toBe('.docx,.doc')
    expect(ACCEPTED_FILE_TYPES.pdf).toBe('.pdf')
  })
})
