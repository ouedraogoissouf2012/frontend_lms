import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn()
vi.mock('@/services/api', () => ({
  default: { post: (...a) => post(...a) },
}))

import { passwordResetService } from '@/services/passwordReset'

describe('passwordResetService (#332)', () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({ success: true, message: 'ok' })
  })

  it('emits X-Institution on forgot-password', async () => {
    await passwordResetService.requestLink('esi', 'a@b.test')
    expect(post).toHaveBeenCalledWith(
      '/auth/forgot-password',
      { email: 'a@b.test' },
      { headers: { 'X-Institution': 'esi' } },
    )
  })

  it('emits X-Institution on reset-password', async () => {
    await passwordResetService.resetPassword('esi', {
      email: 'a@b.test',
      token: 'tok',
      password: 'Nouveau123',
      password_confirmation: 'Nouveau123',
    })
    const [, , opts] = post.mock.calls[0]
    expect(opts.headers['X-Institution']).toBe('esi')
  })
})
