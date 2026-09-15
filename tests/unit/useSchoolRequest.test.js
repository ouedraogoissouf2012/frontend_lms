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

  it('affiche le message serveur, jamais un courriel', async () => {
    submitSchoolRequest.mockResolvedValue({
      message: 'Votre demande est enregistrée. Elle sera examinée par notre équipe.',
    })
    const api = useSchoolRequest()
    await api.submit({
      nom_demandeur: 'Awa',
      email_demandeur: 'awa@test.com',
      nom_ecole: 'Atelier',
      usage_prevu: 'Formations courtes en presentiel.',
    })
    expect(api.notice.value).toMatch(/examinée/)
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
