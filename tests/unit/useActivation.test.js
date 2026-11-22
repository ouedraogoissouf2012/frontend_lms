import { describe, expect, it, vi, beforeEach } from 'vitest'

const activateAccount = vi.fn()
vi.mock('@/services/activation', () => ({
  activateAccount: (...a) => activateAccount(...a),
}))

import { useActivation } from '@/composables/useActivation'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

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

  // #614 : le texte du 410 nomme les deux cas ensemble (« pas valide ou a expiré ») ; il ne dit toujours pas
  // LEQUEL (consommé ou périmé) : un seul 410, un seul texte, celui du catalogue.
  it('410 : un seul message, consomme et expire indistincts', async () => {
    activateAccount.mockRejectedValue({
      response: { status: 410 },
      userMessage: ERROR_MESSAGES.gone,
    })
    const api = useActivation()
    await api.submit({
      token: 'jeton',
      password: 'Secret123',
      password_confirmation: 'Secret123',
    })
    expect(api.error.value).toBe(ERROR_MESSAGES.gone)
    expect(api.error.value).not.toMatch(/déjà servi|déjà utilisé/)
    expect(api.notice.value).toBe('')
  })
})
