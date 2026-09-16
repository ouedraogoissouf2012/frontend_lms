import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  default: { post: vi.fn() },
}))

import api from '@/services/api'
import { activateAccount } from '@/services/activation'

describe('activateAccount (#394)', () => {
  beforeEach(() => {
    api.post.mockReset()
    api.post.mockResolvedValue({ message: 'ok' })
  })

  it('poste /activation without X-Institution', async () => {
    const payload = {
      token: 'jeton',
      password: 'Secret123',
      password_confirmation: 'Secret123',
    }
    await activateAccount(payload)
    const [url, body, config] = api.post.mock.calls[0]
    expect(url).toBe('/activation')
    expect(body).toEqual(payload)
    expect(config).toBeUndefined()
  })
})
