/**
 * Test du composable useAdminStats (#H3 ≤300) : chargement des statistiques
 * plateforme depuis le service auth (fallback à zéro), exposition du loading et
 * du refresh. Services auth + cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuth = vi.hoisted(() => ({
  getUser: vi.fn(),
  getMeta: vi.fn(),
}))

vi.mock('@/services/api', () => ({ auth: mockAuth }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))

import { useAdminStats } from '@/composables/useAdminStats'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminStats(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminStats (#H3)', () => {
  beforeEach(() => {
    mockAuth.getUser.mockReset()
    mockAuth.getMeta.mockReset()
  })

  it('charge les statistiques depuis admin_data au montage', async () => {
    mockAuth.getUser.mockReturnValue({ admin_data: { statistics: { nb_enseignants: 7, nb_etudiants: 42 } } })
    mockAuth.getMeta.mockReturnValue({ annee_universitaire_courante: { nom: '2025-2026' } })
    const s = await setup()
    expect(s.stats.value.nb_enseignants).toBe(7)
    expect(s.stats.value.nb_etudiants).toBe(42)
    expect(s.meta.value.annee_universitaire_courante.nom).toBe('2025-2026')
    expect(s.loading.value).toBe(false)
  })

  it('applique le fallback à zéro sans admin_data', async () => {
    mockAuth.getUser.mockReturnValue({})
    mockAuth.getMeta.mockReturnValue(null)
    const s = await setup()
    expect(s.stats.value.nb_enseignants).toBe(0)
    expect(s.stats.value.taux_presence).toBe(0)
    expect(s.loading.value).toBe(false)
  })

  it('refreshData recharge les statistiques', async () => {
    mockAuth.getUser.mockReturnValue({ admin_data: { statistics: { nb_lessons: 1 } } })
    mockAuth.getMeta.mockReturnValue(null)
    const s = await setup()
    expect(s.stats.value.nb_lessons).toBe(1)
    mockAuth.getUser.mockReturnValue({ admin_data: { statistics: { nb_lessons: 9 } } })
    s.refreshData()
    await flushPromises()
    expect(s.stats.value.nb_lessons).toBe(9)
  })
})
