import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/api', () => ({
  auth: { getActiveInstitutions: vi.fn().mockResolvedValue([]) },
}))

const requestLink = vi.fn()
const resetPassword = vi.fn()
vi.mock('@/services/passwordReset', () => ({
  passwordResetService: {
    requestLink: (...a) => requestLink(...a),
    resetPassword: (...a) => resetPassword(...a),
  },
}))

import { usePasswordReset } from '@/composables/usePasswordReset'

describe('usePasswordReset (#332)', () => {
  it('shows a usable message on 400', async () => {
    requestLink.mockRejectedValue({ userMessage: 'En-tête X-Institution requis' })
    const api = usePasswordReset()
    await api.requestLink('', 'a@b.test')
    expect(api.error.value).toBe('En-tête X-Institution requis')
  })

  it('shows the backend message when the account has no email', async () => {
    requestLink.mockRejectedValue({
      userMessage: "Ce compte n'a pas d'adresse courriel : la réinitialisation est impossible.",
    })
    const api = usePasswordReset()
    await api.requestLink('esi', 'a@b.test')
    expect(api.error.value).toMatch(/courriel/)
  })
})
