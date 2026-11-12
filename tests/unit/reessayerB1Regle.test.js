/**
 * Lot « Réessayer », PR B1 : une réponse 2xx « sans success » n'a pas de `response` HTTP en échec,
 * donc `estPannePassagere` la prenait pour une panne et l'écran offrait « Réessayer » sur un refus.
 *
 * Règle validée (ARRÊT 1 de B) : un `reason` CONNU du catalogue en fait un refus définitif, dit par
 * son message du catalogue ; sans `reason`, ou avec un `reason` inconnu, l'anomalie reste une panne
 * (une charge mal formée peut se lever en réessayant). Les deux sens, directement et à travers les
 * deux constructeurs qui l'emploient (exigerSucces de klassciStructure, klassciCourses).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn() }))
// Les services importent `./api` : même module que `@/services/api`, un seul mock suffit.
vi.mock('@/services/api', () => ({ default: api }))

import { invalidResponseError, messageForReason } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { estPannePassagere } from '@/utils/pannePassagere'
import { klassciStructureService } from '@/services/klassciStructure'
import { klassciCoursesService } from '@/services/klassciCourses'

const MOTIF = 'klassci_token_missing'
const PIEGE = 'Texte du serveur, jamais affiché'

beforeEach(() => { api.get.mockReset() })

describe('invalidResponseError — le reason connu décide', () => {
  it('sans réponse : panne passagère, message générique (inchangé pour les appelants existants)', () => {
    const e = invalidResponseError('GET /x sans success')
    expect(e.definitif).toBeUndefined()
    expect(estPannePassagere(e)).toBe(true)
    expect(e.userMessage).toBe(ERROR_MESSAGES.unknown)
  })

  it('reason connu : refus définitif, dit par le catalogue, jamais par le texte du serveur', () => {
    const e = invalidResponseError('GET /x sans success', { success: false, reason: MOTIF, message: PIEGE })
    expect(e.definitif).toBe(true)
    expect(estPannePassagere(e)).toBe(false)
    expect(e.userMessage).toBe(messageForReason(MOTIF))
    expect(e.userMessage).not.toContain(PIEGE)
  })

  it('reason inconnu ou absent : panne passagère, message générique', () => {
    for (const corps of [{ success: false, reason: 'motif-inconnu' }, { success: false }, { success: false, message: PIEGE }]) {
      const e = invalidResponseError('GET /x sans success', corps)
      expect(e.definitif).toBeUndefined()
      expect(estPannePassagere(e)).toBe(true)
      expect(e.userMessage).toBe(ERROR_MESSAGES.unknown)
    }
  })
})

describe('exigerSucces (klassciStructure) — la règle à travers ses appelants', () => {
  it('2xx « success: false » avec reason connu : rejet définitif', async () => {
    api.get.mockResolvedValue({ success: false, reason: MOTIF, message: PIEGE })
    const e = await klassciStructureService.getClasses().catch((err) => err)
    expect(e.definitif).toBe(true)
    expect(estPannePassagere(e)).toBe(false)
    expect(e.userMessage).toBe(messageForReason(MOTIF))
  })

  it('2xx sans success ni reason : rejet passager (Réessayer reste)', async () => {
    api.get.mockResolvedValue({ data: [] })
    const e = await klassciStructureService.getMatieres().catch((err) => err)
    expect(e).toBeInstanceOf(Error)
    expect(e.definitif).toBeUndefined()
    expect(estPannePassagere(e)).toBe(true)
  })
})

describe('klassciCourses.getMyCourses — la règle à travers son appel', () => {
  it('reason connu : définitif ; sans reason : passager', async () => {
    api.get.mockResolvedValue({ success: false, reason: MOTIF })
    const refus = await klassciCoursesService.getMyCourses().catch((err) => err)
    expect(refus.definitif).toBe(true)
    expect(estPannePassagere(refus)).toBe(false)

    api.get.mockResolvedValue({ success: false })
    const anomalie = await klassciCoursesService.getMyCourses().catch((err) => err)
    expect(anomalie.definitif).toBeUndefined()
    expect(estPannePassagere(anomalie)).toBe(true)
  })
})
