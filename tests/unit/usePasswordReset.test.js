import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/api', () => ({
  auth: { getActiveInstitutions: vi.fn().mockResolvedValue([]) },
}))

const requestLink = vi.fn()
vi.mock('@/services/passwordReset', () => ({
  passwordResetService: {
    requestLink: (...a) => requestLink(...a),
  },
}))

import { usePasswordReset } from '@/composables/usePasswordReset'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

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

// D477 : les textes du front, jamais ceux du serveur (D0).
describe('usePasswordReset — jamais le texte du serveur (D477)', () => {
  const panne = () => ({ response: { status: 500, data: { success: false, message: 'Texte serveur, jamais affiché' } } })

  // #613 : sans motif, le texte neutre du front ; plus « Si un compte existe, un courriel a été envoyé. » (aucun ne partait).
  it('une demande réussie : le texte du front', async () => {
    requestLink.mockResolvedValue({ success: true, message: 'Texte serveur, jamais affiché' })
    const api = usePasswordReset()
    await api.requestLink('esi', 'a@b.test')
    expect(api.notice.value).toBe(ERROR_MESSAGES.demandeDeReinitialisationRecue)
  })

  it('un échec sans message du catalogue : la catégorie, jamais le texte du serveur', async () => {
    requestLink.mockRejectedValue(panne())
    const api = usePasswordReset()
    await api.requestLink('esi', 'a@b.test')
    expect(api.error.value).not.toContain('Texte serveur, jamais affiché')
  })
})
