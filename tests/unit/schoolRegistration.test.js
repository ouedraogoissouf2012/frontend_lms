import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  default: { post: vi.fn() },
}))

import api from '@/services/api'
import { submitSchoolRequest } from '@/services/schoolRegistration'

describe('submitSchoolRequest (#392)', () => {
  beforeEach(() => {
    api.post.mockReset()
    api.post.mockResolvedValue({ message: 'ok' })
  })

  it('poste /school-requests without X-Institution', async () => {
    const payload = {
      nom_demandeur: 'Awa',
      email_demandeur: 'awa@test.com',
      nom_ecole: 'Atelier',
      usage_prevu: 'Formations courtes en presentiel.',
    }
    await submitSchoolRequest(payload)
    expect(api.post).toHaveBeenCalledTimes(1)
    const [url, body, config] = api.post.mock.calls[0]
    expect(url).toBe('/school-requests')
    expect(body).toEqual(payload)
    expect(config).toBeUndefined()
  })
})
