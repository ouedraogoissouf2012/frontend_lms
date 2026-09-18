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
    // Stockage RÉEL de jsdom, remis à zéro — convention du dépôt
    // (cf. tests/unit/authLogoutRevoke.test.js:37). Un espion sur `setItem`
    // ne verrait PAS une écriture par affectation directe ; le stockage réel
    // attrape les deux.
    sessionStorage.clear()
    localStorage.clear()
  })

  /** Ce qui a été écrit dans l'un ou l'autre stockage, tout mécanisme confondu. */
  const clesStockees = () => [
    ...Object.keys(sessionStorage),
    ...Object.keys(localStorage)
  ]

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

  /**
   * Le titre de ce test promet « en mémoire SEULEMENT ». Jusqu'à #411 il ne
   * vérifiait que la première moitié — que le `ref` se remplit et se vide — et
   * restait donc vert si quelqu'un ajoutait un `localStorage.setItem('lien', …)`
   * pour « éviter de le perdre au rafraîchissement ». Une idée qui paraît
   * serviable, sur un secret affiché une seule fois et non réémissible.
   *
   * La seconde moitié est désormais gardée : aucune clé ne doit apparaître dans
   * l'un ou l'autre stockage. On compare les CLÉS et non un espion sur
   * `setItem`, car `sessionStorage.lien = …` échapperait à l'espion.
   */
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

    expect(clesStockees()).toEqual([])

    api.fermerLien()
    expect(api.lienActivation.value).toBe('')
    expect(clesStockees()).toEqual([])
  })

  it('retire la demande refusee', async () => {
    refuse.mockResolvedValue({ message: 'Demande refusée.' })
    const api = useAdminSchoolRequests()
    api.demandes.value = [{ id: 7 }]
    await api.refuser(7, 'Dossier incomplet pour ouvrir.')
    expect(api.demandes.value).toHaveLength(0)
  })
})
