/**
 * Test du composable useAdminEnseignants (#G1 ≤300) : chargement depuis l'endpoint
 * enrichi, agrégation des statistiques (matières/classes/actifs) et sélection pour
 * la modale. Services KLASSCI + cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, it, expect, vi } from 'vitest'

const h = vi.hoisted(() => ({
  readCache: vi.fn(),
  readCacheStale: vi.fn(),
  writeCache: vi.fn(),
  clearCache: vi.fn(),
  invalidateEntity: vi.fn(),
  getLmsEnseignants: vi.fn(),
  getEnseignants: vi.fn(),
}))

vi.mock('@/services/cache', () => ({
  readCache: h.readCache,
  readCacheStale: h.readCacheStale,
  writeCache: h.writeCache,
  clearCache: h.clearCache,
  invalidateEntity: h.invalidateEntity,
}))
vi.mock('@/services/klassci', () => ({
  default: {
    getLmsEnseignants: h.getLmsEnseignants,
    getEnseignants: h.getEnseignants,
  },
}))

import { useAdminEnseignants } from '@/composables/useAdminEnseignants'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminEnseignants(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminEnseignants (#G1)', () => {
  beforeEach(() => {
    h.readCache.mockReset().mockReturnValue(null)
    h.readCacheStale.mockReset().mockReturnValue({ data: null })
    h.writeCache.mockReset()
    h.clearCache.mockReset()
    h.invalidateEntity.mockReset()
    h.getLmsEnseignants.mockReset().mockResolvedValue({
      success: true,
      data: [
        {
          id: 1, nom: 'Zoé', prenom: 'Prof', email: 'zoe@e.com',
          matieres: [{ id: 11, classes: [{ id: 100 }, { id: 101 }] }],
        },
        {
          id: 2, nom: 'Sans', prenom: 'Cours', email: 'sans@e.com',
          matieres: [],
        },
      ],
    })
    h.getEnseignants.mockReset().mockResolvedValue([])
  })

  it('charge les enseignants depuis l\'endpoint enrichi', async () => {
    const e = await setup()
    expect(e.enseignants.value).toHaveLength(2)
    expect(e.loading.value).toBe(false)
    expect(e.error.value).toBe(null)
  })

  it('agrège les statistiques (matières, classes, actifs)', async () => {
    const e = await setup()
    expect(e.totalMatieres.value).toBe(1)
    expect(e.totalClasses.value).toBe(2)
    expect(e.enseignantsActifs.value).toBe(1)
  })

  it('select/closeModal pilotent selectedEnseignant', async () => {
    const e = await setup()
    e.selectEnseignant({ id: 9 })
    expect(e.selectedEnseignant.value).toEqual({ id: 9 })
    e.closeModal()
    expect(e.selectedEnseignant.value).toBe(null)
  })

  it('ignore un cache non-tableau et normalise une réponse API non-tableau (#13)', async () => {
    h.readCacheStale.mockReturnValue({ data: { stale: true } })
    h.getLmsEnseignants.mockResolvedValue({ success: true, data: { id: 1 } })

    const e = await setup()

    expect(e.enseignants.value).toEqual([])
    expect(e.totalMatieres.value).toBe(0)
    expect(e.totalClasses.value).toBe(0)
    expect(e.enseignantsActifs.value).toBe(0)
  })

  it('accepte une enveloppe enseignants et ignore les éléments invalides (#13)', async () => {
    h.getLmsEnseignants.mockResolvedValue({
      success: true,
      data: {
        enseignants: [
          null,
          { id: 1, matieres: [{ id: 10, classes: [{ id: 100 }] }] },
        ],
      },
    })

    const e = await setup()

    expect(e.enseignants.value).toHaveLength(1)
    expect(e.totalMatieres.value).toBe(1)
    expect(e.totalClasses.value).toBe(1)
    expect(e.enseignantsActifs.value).toBe(1)
  })
})
