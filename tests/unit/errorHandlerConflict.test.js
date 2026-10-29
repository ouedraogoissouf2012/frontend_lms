/**
 * 409 (#391) : un conflit d'état — la période a changé ailleurs — a son propre message
 * du catalogue, au lieu de retomber sur « Une erreur inattendue ». Le message serveur
 * n'est PAS repris : politique fail-secure du module (errorHandler.js).
 */
import { describe, it, expect } from 'vitest'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

describe('errorHandler — 409 conflict (#391)', () => {
  it('409 → catégorie conflict et son message', () => {
    const r = normalizeError({ response: { status: 409, data: { success: false, message: 'Une période « cloturee » ne peut pas être publiée.' } } })
    expect(r.category).toBe('conflict')
    expect(r.userMessage).toBe(ERROR_MESSAGES.conflict)
  })

  it('le message serveur n’est jamais repris tel quel', () => {
    const r = normalizeError({ response: { status: 409, data: { message: 'détail interne' } } })
    expect(r.userMessage).not.toContain('détail interne')
  })

  it('le catalogue porte un message conflict non vide', () => {
    expect(typeof ERROR_MESSAGES.conflict).toBe('string')
    expect(ERROR_MESSAGES.conflict.length).toBeGreaterThan(10)
  })
})
