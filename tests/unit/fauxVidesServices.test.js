/**
 * Faux vides (suite du lot « Réessayer », revue de #519) : un 2xx « success: false » se lisait comme
 * une liste vide, un FAIT inventé. Il devient une erreur dite ; Réessayer selon la règle commune
 * (refus avec un reason connu du catalogue ; anomalie sans reason, qu'un nouvel essai peut lever).
 *
 * Trois services rendaient une liste vide sur un « success: false » : lmsMatieres.getMyMatieres (« Aucune
 * matière assignée »), klassciSeances.getUpcomingSeances (calendrier vide) et
 * klassciSeances.getMyVisioConferences (aucune visio). Ils rejettent désormais.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/services/api', () => ({ default: api }))

import { lmsMatieresService } from '@/services/lmsMatieres'
import { klassciSeancesService } from '@/services/klassciSeances'
import { estPannePassagere } from '@/utils/pannePassagere'

beforeEach(() => { api.get.mockReset() })

describe('services — un « success: false » rejette, jamais une liste vide', () => {
  it('getMyMatieres : rejet (anomalie → Réessayer ; reason connu → refus)', async () => {
    api.get.mockResolvedValue({ success: false })
    const anomalie = await lmsMatieresService.getMyMatieres().catch((e) => e)
    expect(anomalie).toBeInstanceOf(Error)
    expect(estPannePassagere(anomalie)).toBe(true)
    api.get.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    const refus = await lmsMatieresService.getMyMatieres().catch((e) => e)
    expect(estPannePassagere(refus)).toBe(false)
  })

  it('getMyMatieres : une réponse servie reste une liste', async () => {
    api.get.mockResolvedValue({ success: true, data: [{ id: 1 }] })
    expect(await lmsMatieresService.getMyMatieres()).toEqual([{ id: 1 }])
  })

  it('getUpcomingSeances : rejet sur « success: false », la liste sinon', async () => {
    api.get.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    const refus = await klassciSeancesService.getUpcomingSeances().catch((e) => e)
    expect(refus).toBeInstanceOf(Error)
    expect(estPannePassagere(refus)).toBe(false)
    api.get.mockResolvedValue({ success: true, data: [{ id: 7 }] })
    expect(await klassciSeancesService.getUpcomingSeances()).toEqual([{ id: 7 }])
  })

  // Sans consommateur aujourd'hui (aucun appel dans src/) : le défaut est latent, fermé avant tout usage.
  it('getMyVisioConferences : rejet sur « success: false », la liste sinon', async () => {
    api.get.mockResolvedValue({ success: false })
    const anomalie = await klassciSeancesService.getMyVisioConferences().catch((e) => e)
    expect(anomalie).toBeInstanceOf(Error)
    expect(estPannePassagere(anomalie)).toBe(true)
    api.get.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    expect(estPannePassagere(await klassciSeancesService.getMyVisioConferences().catch((e) => e))).toBe(false)
    api.get.mockResolvedValue({ success: true, data: [{ id: 9 }] })
    expect(await klassciSeancesService.getMyVisioConferences()).toEqual([{ id: 9 }])
  })
})
