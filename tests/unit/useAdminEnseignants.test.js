/**
 * Test du composable useAdminEnseignants (#G1 ≤300) : chargement depuis l'endpoint
 * enrichi, agrégation des statistiques (matières/classes/actifs) et sélection pour
 * la modale. Services KLASSCI + cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/cache', () => ({
  readCache: () => null,
  writeCache: () => {},
  clearCache: () => {},
}))
vi.mock('@/services/klassci', () => ({
  default: {
    getLmsEnseignants: () => Promise.resolve({
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
    }),
    getEnseignants: () => Promise.resolve([]),
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
})
