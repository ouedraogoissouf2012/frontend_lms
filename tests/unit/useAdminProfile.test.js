/**
 * Test du composable useAdminProfile (#H3 ≤300) : utilisateur courant via auth,
 * initiales, libellé de rôle, date d'inscription formatée et stats système.
 * Service `auth` mocké.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const mockUser = {
  nom: 'Dupont',
  prenom: 'Marie',
  email: 'marie@e.com',
  role: 'admin',
  created_at: '2024-01-15T10:00:00Z',
  permissions: ['users:read'],
  admin_data: {
    statistics: {
      nb_enseignants: 25,
      nb_etudiants: 350,
      nb_classes_actives: 15,
      nb_matieres_actives: 30,
    },
  },
}

vi.mock('@/services/api', () => ({
  auth: { getUser: () => mockUser },
}))

import { useAdminProfile } from '@/composables/useAdminProfile'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminProfile(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminProfile (#H3)', () => {
  it('charge l\'utilisateur courant au montage', async () => {
    const u = await setup()
    expect(u.user.value).toEqual(mockUser)
  })

  it('calcule les initiales (prénom + nom, majuscules)', async () => {
    const u = await setup()
    expect(u.userInitials.value).toBe('MD')
  })

  it('expose le libellé de rôle traduit', async () => {
    const u = await setup()
    expect(u.roleLabel.value).toBe('Administrateur')
  })

  it('formate la date d\'inscription en français', async () => {
    const u = await setup()
    expect(u.memberSince.value).toBe('15 janvier 2024')
  })

  it('mappe les vraies statistiques depuis admin_data.statistics', async () => {
    const u = await setup()
    expect(u.stats.value.enseignants).toBe(25)
    expect(u.stats.value.etudiants).toBe(350)
    expect(u.stats.value.classes).toBe(15)
    expect(u.stats.value.matieres).toBe(30)
  })

  it('getRoleLabel renvoie le rôle brut si inconnu', async () => {
    const u = await setup()
    expect(u.getRoleLabel('inconnu')).toBe('inconnu')
  })

  it('formatDate renvoie "Non disponible" sans date', async () => {
    const u = await setup()
    expect(u.formatDate(null)).toBe('Non disponible')
  })
})
