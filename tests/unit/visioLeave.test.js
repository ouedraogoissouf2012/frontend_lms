/**
 * Tests du service de sortie visio fiable (fix Beacon).
 * Vérifie l'URL réelle (/api/lms/seances/:id/leave), l'auth Bearer + keepalive,
 * et le comportement sans token / sur échec réseau.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { tokenRef } = vi.hoisted(() => ({ tokenRef: { value: 'TOK' } }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ token: tokenRef.value }) }))
vi.mock('@/constants/http', () => ({ apiBaseUrl: () => 'http://api.test/api' }))

import { sendVisioLeaveBeacon } from '@/services/visioLeave'

describe('services/visioLeave (fix Beacon)', () => {
  beforeEach(() => {
    tokenRef.value = 'TOK'
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }))
  })

  it('POST sur la vraie route /api/lms/seances/:id/leave avec Bearer + keepalive', async () => {
    const ok = await sendVisioLeaveBeacon(42)
    expect(ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/api/lms/seances/42/leave',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        headers: expect.objectContaining({ Authorization: 'Bearer TOK' })
      })
    )
  })

  it('false sans token (pas d\'appel réseau)', async () => {
    tokenRef.value = null
    const ok = await sendVisioLeaveBeacon(1)
    expect(ok).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('false si fetch échoue', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network')))
    expect(await sendVisioLeaveBeacon(1)).toBe(false)
  })
})
