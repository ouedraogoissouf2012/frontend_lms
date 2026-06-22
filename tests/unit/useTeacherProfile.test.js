/**
 * Test du composable useTeacherProfile (#H11 ≤300) : utilisateur courant,
 * dérivés (initiales, libellé de rôle, date d'inscription) et chargement des
 * statistiques. Services auth + teacherStats mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { authMock, teacherStatsMock } = vi.hoisted(() => ({
  authMock: { getUser: vi.fn() },
  teacherStatsMock: { getStats: vi.fn() },
}))

vi.mock('@/services/api', () => ({ auth: authMock, teacherStats: teacherStatsMock }))

import { useTeacherProfile } from '@/composables/useTeacherProfile'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherProfile(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherProfile (#H11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.getUser.mockReturnValue({
      nom: 'Dupont', prenom: 'Marie', role: 'enseignant',
      email: 'm@e.com', created_at: '2024-01-15',
    })
    teacherStatsMock.getStats.mockResolvedValue({ matieres: 3, classes: 2, evaluations: 5, lessons: 9 })
  })

  it('charge l\'utilisateur et calcule les initiales (prénom+nom)', async () => {
    const p = await setup()
    expect(p.user.value.nom).toBe('Dupont')
    expect(p.userInitials.value).toBe('MD')
  })

  it('mappe le rôle en libellé lisible', async () => {
    const p = await setup()
    expect(p.roleLabel.value).toBe('Enseignant')
  })

  it('formate la date d\'inscription en français', async () => {
    const p = await setup()
    expect(p.memberSince.value).toMatch(/2024/)
    expect(p.formatDate(null)).toBe('Non disponible')
  })

  it('charge les statistiques via teacherStats', async () => {
    const p = await setup()
    expect(p.stats.value.matieres).toBe(3)
    expect(p.stats.value.lessons).toBe(9)
  })

  it('conserve les valeurs par défaut si getStats échoue', async () => {
    teacherStatsMock.getStats.mockRejectedValue(new Error('boom'))
    const p = await setup()
    expect(p.stats.value).toEqual({ matieres: 0, classes: 0, evaluations: 0, lessons: 0 })
  })
})
