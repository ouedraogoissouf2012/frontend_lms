/**
 * Test du composable useAdminProfile (#H3 ≤300) : utilisateur courant via auth,
 * initiales, libellé de rôle, date d'inscription formatée et stats système.
 *
 * Le payload d'utilisateur mocké ici REPRODUIT celui que le backend renvoie
 * réellement au login : il ne contient PAS de `admin_data`. L'ancien test en
 * fabriquait un, ce qui verdissait un chemin que la production n'emprunte jamais —
 * l'écran affichait donc quatre zéros pendant que le test passait.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.hoisted(() => ({ getUser: vi.fn(), getMeta: vi.fn() }))
const mockKlassci = vi.hoisted(() => ({
  getClasses: vi.fn(), getMatieres: vi.fn(), getEnseignants: vi.fn(),
}))

vi.mock('@/services/api', () => ({ auth: mockAuth }))
vi.mock('@/services/klassci', () => ({ klassciService: mockKlassci, default: mockKlassci }))

import { useAdminProfile } from '@/composables/useAdminProfile'

/** Payload réel du login : ni `admin_data`, ni statistiques embarquées. */
const realUser = {
  nom: 'Dupont',
  prenom: 'Marie',
  email: 'marie@e.com',
  role: 'admin',
  created_at: '2024-01-15T10:00:00Z',
  permissions: ['users:read'],
}

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminProfile(); return () => null } })
  mount(Comp)
  await flushPromises()
  await flushPromises()
  return api
}

beforeEach(() => {
  mockAuth.getUser.mockReset().mockReturnValue(realUser)
  mockAuth.getMeta.mockReset().mockReturnValue(null)
  mockKlassci.getClasses.mockReset().mockResolvedValue([])
  mockKlassci.getMatieres.mockReset().mockResolvedValue([])
  mockKlassci.getEnseignants.mockReset().mockResolvedValue([])
})

describe('useAdminProfile (#H3)', () => {
  it('expose l’utilisateur courant et ses initiales', async () => {
    const p = await setup()
    expect(p.user.value.email).toBe('marie@e.com')
    expect(p.userInitials.value).toBe('MD')
  })

  it('formate la date d’inscription, et son absence', async () => {
    const p = await setup()
    expect(p.memberSince.value).toContain('2024')
    expect(p.formatDate(null)).toBe('Non disponible')
  })

  describe('statistiques système', () => {
    it('charge de VRAIES statistiques malgré l’absence de admin_data', async () => {
      mockKlassci.getClasses.mockResolvedValue([
        { id: 1, places_occupees: 6 }, { id: 2, places_occupees: 5 },
      ])
      mockKlassci.getMatieres.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
      mockKlassci.getEnseignants.mockResolvedValue([{ id: 1 }, { id: 2 }])

      const p = await setup()

      expect(p.stats.value.enseignants).toBe(2)
      expect(p.stats.value.etudiants).toBe(11)
      expect(p.stats.value.classes).toBe(2)
      expect(p.stats.value.matieres).toBe(3)
    })

    it('marque NON MESURÉ (null) plutôt que zéro quand le chargement échoue', async () => {
      mockKlassci.getClasses.mockRejectedValue(new Error('down'))
      mockKlassci.getMatieres.mockRejectedValue(new Error('down'))
      mockKlassci.getEnseignants.mockRejectedValue(new Error('down'))

      const p = await setup()

      expect(p.stats.value.enseignants).toBe(null)
      expect(p.stats.value.etudiants).toBe(null)
      expect(p.stats.value.classes).toBe(null)
      expect(p.stats.value.matieres).toBe(null)
    })
  })

  describe('libellé de rôle : délégué à constants/roles.js (#659)', () => {
    it('n’intitule PAS « Super Administrateur » un admin d’ÉTABLISSEMENT', async () => {
      mockAuth.getUser.mockReturnValue({ ...realUser, role: 'superAdmin' })
      const p = await setup()
      expect(p.roleLabel.value).toBe('Administrateur')
    })

    it('réserve « Super Administrateur » au supradmin PLATEFORME', async () => {
      mockAuth.getUser.mockReturnValue({ ...realUser, role: 'supradmin' })
      const p = await setup()
      expect(p.roleLabel.value).toBe('Super Administrateur')
    })

    it('reconnaît les alias de roles.js', async () => {
      mockAuth.getUser.mockReturnValue({ ...realUser, role: 'coordinator' })
      expect((await setup()).roleLabel.value).toBe('Coordinateur')
    })

    it('ne laisse pas fuir un rôle brut inconnu dans l’UI', async () => {
      mockAuth.getUser.mockReturnValue({ ...realUser, role: 'chef_cuisinier' })
      expect((await setup()).roleLabel.value).toBe('')
    })
  })
})
