/**
 * L'enveloppe de GET /proxy/evaluations est VÉRIFIÉE, jamais fabriquée.
 *
 * Forme mesurée de la réponse : `{ success: true, data: [...] }`. Le serveur relaie
 * le corps reçu de KLASSCI tel quel : un 200 `{ success: false }` n'est donc pas
 * exclu. Le service le rendait `{ success: true, data: <l'enveloppe entière> }`, et
 * l'écran des évaluations enseignant cassait (`klassci.map` sur un objet) au lieu
 * de dire la panne. Modèle : `klassciCourses.getMyCourses` (#436).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const getMock = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...args) => getMock(...args) } }))
vi.mock('@/services/evaluation', () => ({ default: { getEvaluations: vi.fn().mockResolvedValue({ success: true, data: [] }) } }))
vi.mock('@/services/cache', () => ({ readCache: vi.fn(() => null), writeCache: vi.fn() }))

import { klassciEvaluationsService } from '@/services/klassciEvaluations'

// Un BLOC, pas `() => getMock.mockReset()` : `mockReset` rend le mock, et Vitest appelle
// toute fonction rendue par beforeEach comme nettoyage, ici sans argument, après le test.
beforeEach(() => {
  getMock.mockReset()
})

describe('klassciEvaluations.getEvaluations — enveloppe', () => {
  it('rend la liste reçue quand l enveloppe est conforme', async () => {
    getMock.mockResolvedValue({ success: true, data: [{ id: 1 }] })
    await expect(klassciEvaluationsService.getEvaluations()).resolves.toEqual({ success: true, data: [{ id: 1 }] })
  })

  it.each([
    ['success faux', { success: false, message: 'refus' }],
    ['success absent', { data: [{ id: 1 }] }],
    ['data absente', { success: true }],
    ['data qui n est pas une liste', { success: true, data: { id: 1 } }],
    ['corps nu, sans enveloppe', [{ id: 1 }]],
  ])('rejette une réponse non conforme (%s), avec le message du catalogue', async (_nom, corps) => {
    getMock.mockResolvedValue(corps)
    const echec = await klassciEvaluationsService.getEvaluations().catch((e) => e)
    expect(echec).toBeInstanceOf(Error)
    expect(echec.userMessage).toBe(ERROR_MESSAGES.unknown)
  })
})

describe('écran des évaluations enseignant — un 200 { success: false } ne casse plus rien', () => {
  it('la liste fusionnée reste une liste : pas de TypeError, pas d objet pris pour une liste', async () => {
    // Le dashboard de repli passe par le même `api.get` : il échoue lui aussi.
    getMock.mockImplementation((url) =>
      url.includes('teacher-dashboard')
        ? Promise.reject(Object.assign(new Error('HTTP 503'), { response: { status: 503, data: {} } }))
        : Promise.resolve({ success: false, message: 'refus' })
    )
    const { useTeacherEvaluations } = await import('@/composables/useTeacherEvaluations')
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(Array.isArray(c.evaluationsKlassci.value)).toBe(true)
    expect(() => c.evaluationsWithOnline.value).not.toThrow()
    expect(c.evaluationsWithOnline.value).toEqual([])
  })
})

