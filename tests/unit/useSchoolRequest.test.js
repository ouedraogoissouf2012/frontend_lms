import { describe, expect, it, vi, beforeEach } from 'vitest'

const submitSchoolRequest = vi.fn()
vi.mock('@/services/schoolRegistration', () => ({
  submitSchoolRequest: (...a) => submitSchoolRequest(...a),
}))

import { useSchoolRequest } from '@/composables/useSchoolRequest'

describe('useSchoolRequest (#392)', () => {
  beforeEach(() => {
    submitSchoolRequest.mockReset()
  })

  // D477 (renversé, déclaré) : le texte du front, jamais celui du serveur (D0).
  it('affiche le texte du front, jamais le message serveur ni un courriel', async () => {
    submitSchoolRequest.mockResolvedValue({ message: 'Texte serveur, jamais affiché' })
    const api = useSchoolRequest()
    await api.submit({
      nom_demandeur: 'Awa',
      email_demandeur: 'awa@test.com',
      nom_ecole: 'Atelier',
      usage_prevu: 'Formations courtes en presentiel.',
    })
    expect(api.notice.value).toBe('Votre demande est enregistrée. Elle sera examinée par notre équipe.')
    expect(api.notice.value).not.toMatch(/e-?mail|courriel envoy/i)
    expect(api.error.value).toBe('')
  })

  it('montre l erreur 422', async () => {
    submitSchoolRequest.mockRejectedValue({
      userMessage: 'Décrivez brièvement les formations que vous comptez animer.',
    })
    const api = useSchoolRequest()
    await api.submit({
      nom_demandeur: 'Awa',
      email_demandeur: 'awa@test.com',
      nom_ecole: 'Atelier',
      usage_prevu: 'court',
    })
    expect(api.error.value).toMatch(/formations/)
    expect(api.notice.value).toBe('')
  })
})

// D477 : un échec sans message du catalogue dit sa catégorie, jamais le texte du serveur.
it('useSchoolRequest — un échec sans message du catalogue : jamais le texte du serveur (D477)', async () => {
  submitSchoolRequest.mockReset()
  submitSchoolRequest.mockRejectedValue({ response: { status: 500, data: { success: false, message: 'Texte serveur, jamais affiché' } } })
  const api = useSchoolRequest()
  await api.submit({ nom_demandeur: 'Awa', email_demandeur: 'awa@test.com', nom_ecole: 'Atelier', usage_prevu: 'x' })
  expect(api.error.value).not.toContain('Texte serveur, jamais affiché')
  expect(api.error.value).not.toBe('')
})
