/**
 * Tests du moteur de heartbeat visio mutualisé (#26) — useVisioHeartbeat.
 * Couvre sendHeartbeat : actif/inactif, garde seanceId, et perte de
 * participation (404 → arrêt + callback). Le Web Worker n'existe pas sous
 * jsdom ; on cible ici la logique d'envoi, indépendante du transport.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockHeartbeat } = vi.hoisted(() => ({ mockHeartbeat: vi.fn() }))

vi.mock('@/services/lms', () => ({
  default: { heartbeatVisio: mockHeartbeat }
}))

import { useVisioHeartbeat } from '@/composables/useVisioHeartbeat'

describe('useVisioHeartbeat (#26)', () => {
  beforeEach(() => {
    mockHeartbeat.mockReset()
    mockHeartbeat.mockResolvedValue({ success: true })
  })

  it('envoie un heartbeat quand actif et séance présente', async () => {
    const hb = useVisioHeartbeat({ getSeanceId: () => 42, isActive: () => true })
    await hb.sendHeartbeat()
    expect(mockHeartbeat).toHaveBeenCalledWith(42)
  })

  it("n'envoie rien si inactif", async () => {
    const hb = useVisioHeartbeat({ getSeanceId: () => 42, isActive: () => false })
    await hb.sendHeartbeat()
    expect(mockHeartbeat).not.toHaveBeenCalled()
  })

  it("n'envoie rien sans séance active", async () => {
    const hb = useVisioHeartbeat({ getSeanceId: () => null, isActive: () => true })
    await hb.sendHeartbeat()
    expect(mockHeartbeat).not.toHaveBeenCalled()
  })

  it('sur 404, appelle onParticipationLost', async () => {
    const onLost = vi.fn()
    mockHeartbeat.mockRejectedValue({ response: { status: 404 } })
    const hb = useVisioHeartbeat({
      getSeanceId: () => 7,
      isActive: () => true,
      onParticipationLost: onLost
    })
    await hb.sendHeartbeat()
    expect(onLost).toHaveBeenCalledOnce()
  })

  it('sur erreur non-404, ne déclenche pas onParticipationLost', async () => {
    const onLost = vi.fn()
    mockHeartbeat.mockRejectedValue({ response: { status: 500 } })
    const hb = useVisioHeartbeat({
      getSeanceId: () => 7,
      isActive: () => true,
      onParticipationLost: onLost
    })
    await hb.sendHeartbeat()
    expect(onLost).not.toHaveBeenCalled()
  })
})
