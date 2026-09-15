import { describe, expect, it, vi, beforeEach } from 'vitest'

const list = vi.fn()
const validate = vi.fn()
const refuse = vi.fn()
vi.mock('@/services/schoolRequests', () => ({
  schoolRequestsService: {
    list: (...a) => list(...a),
    validate: (...a) => validate(...a),
    refuse: (...a) => refuse(...a),
  },
}))

import { useAdminSchoolRequests } from '@/composables/useAdminSchoolRequests'

describe('useAdminSchoolRequests (#393)', () => {
  beforeEach(() => {
    list.mockReset()
    validate.mockReset()
    refuse.mockReset()
  })

  it('extrait la file paginee', async () => {
    list.mockResolvedValue({
      data: [{ id: 1, nom_ecole: 'Atelier' }],
      meta: { current_page: 1, last_page: 2 },
    })
    const api = useAdminSchoolRequests()
    await api.load(1)
    expect(api.demandes.value).toHaveLength(1)
    expect(api.lastPage.value).toBe(2)
  })

  it('garde le lien en memoire seulement', async () => {
    validate.mockResolvedValue({
      data: { activation_url: 'https://lms.test/activer?t=abc' },
      message: 'École ouverte. Transmettez le lien d\'activation à son responsable : il ne sera plus affiché.',
    })
    const api = useAdminSchoolRequests()
    api.demandes.value = [{ id: 7 }]
    await api.valider(7, 'atelier')
    expect(api.lienActivation.value).toContain('/activer')
    expect(api.demandes.value).toHaveLength(0)
    api.fermerLien()
    expect(api.lienActivation.value).toBe('')
  })

  it('retire la demande refusee', async () => {
    refuse.mockResolvedValue({ message: 'Demande refusée.' })
    const api = useAdminSchoolRequests()
    api.demandes.value = [{ id: 7 }]
    await api.refuser(7, 'Dossier incomplet pour ouvrir.')
    expect(api.demandes.value).toHaveLength(0)
  })
})
