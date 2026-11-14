import { describe, expect, it, vi, beforeEach } from 'vitest'

const activateAccount = vi.fn()
vi.mock('@/services/activation', () => ({
  activateAccount: (...a) => activateAccount(...a),
}))

import { useActivation } from '@/composables/useActivation'

describe('useActivation (#394)', () => {
  beforeEach(() => {
    activateAccount.mockReset()
  })

  // C43 (renversé, déclaré) : le texte du FRONT, jamais celui du serveur (D0).
  it('affiche le message du front, jamais le texte du serveur ni un courriel', async () => {
    activateAccount.mockResolvedValue({ message: 'Texte serveur, jamais affiché' })
    const api = useActivation()
    await api.submit({
      token: 'jeton',
      password: 'Secret123',
      password_confirmation: 'Secret123',
    })
    expect(api.notice.value).toBe('Votre mot de passe est enregistré. Vous pouvez vous connecter.')
    expect(api.notice.value).not.toMatch(/e-?mail|courriel envoy/i)
  })

  it('410 : un seul message, consomme et expire indistincts', async () => {
    activateAccount.mockRejectedValue({
      userMessage: 'Ce lien n\'est plus valable. Demandez-en un nouveau à votre administrateur.',
    })
    const api = useActivation()
    await api.submit({
      token: 'jeton',
      password: 'Secret123',
      password_confirmation: 'Secret123',
    })
    expect(api.error.value).toMatch(/plus valable/)
    expect(api.error.value).not.toMatch(/déjà servi|expiré/)
    expect(api.notice.value).toBe('')
  })
})
