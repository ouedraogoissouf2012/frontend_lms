/**
 * Test du composable useAdminClasses (#G1 ≤300) : chargement + enrichissement des
 * classes, filtres (filière/niveau/statut), stats, reset et navigation. Services
 * KLASSCI, cache et vue-router mockés. Calqué sur useAdminUsers.test.js.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))
vi.mock('@/services/klassci', () => ({
  klassciService: {
    getClasses: () => Promise.resolve([
      { id: 1, name: '6e A', is_active: true, filiere: { id: 11 }, niveau: { id: 21 }, effectif_max: 40 },
      { id: 2, name: '5e B', is_active: false, filiere: { id: 12 }, niveau: { id: 22 } },
    ]),
    getMatieres: () => Promise.resolve([{ id: 1 }, { id: 2 }, { id: 3 }]),
    getStructure: () => Promise.resolve({
      filieres: [{ id: 11, nom: 'Sciences' }, { id: 12, nom: 'Lettres' }],
      niveaux: [{ id: 21, nom: 'Niv 1' }, { id: 22, nom: 'Niv 2' }],
    }),
    getClasseEtudiants: (id) => Promise.resolve(id === 1 ? [{ id: 100 }, { id: 101 }] : [{ id: 200 }]),
  },
}))

import { useAdminClasses } from '@/composables/useAdminClasses'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminClasses(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminClasses (#G1)', () => {
  it('charge et enrichit les classes (compteurs étudiants/matières)', async () => {
    const c = await setup()
    expect(c.classes.value).toHaveLength(2)
    expect(c.loading.value).toBe(false)
    expect(c.classes.value[0].places_occupees).toBe(2)
    expect(c.classes.value[0].nb_matieres).toBe(3)
  })

  it('calcule les stats (total, étudiants, matières, actives)', async () => {
    const c = await setup()
    expect(c.stats.value.total).toBe(2)
    expect(c.stats.value.totalEtudiants).toBe(3) // 2 + 1
    expect(c.stats.value.totalMatieres).toBe(6) // 3 + 3
    expect(c.stats.value.actives).toBe(1)
  })

  it('filtre par filière', async () => {
    const c = await setup()
    c.filters.value.filiere_id = '11'
    expect(c.filteredClasses.value).toHaveLength(1)
    expect(c.filteredClasses.value[0].id).toBe(1)
  })

  it('filtre par niveau', async () => {
    const c = await setup()
    c.filters.value.niveau_id = '22'
    expect(c.filteredClasses.value).toHaveLength(1)
    expect(c.filteredClasses.value[0].id).toBe(2)
  })

  it('filtre par statut (active/inactive)', async () => {
    const c = await setup()
    c.filters.value.statut = 'active'
    expect(c.filteredClasses.value).toHaveLength(1)
    expect(c.filteredClasses.value[0].is_active).toBe(true)
  })

  it('resetFilters remet les filtres à vide', async () => {
    const c = await setup()
    c.filters.value.filiere_id = '11'
    c.filters.value.niveau_id = '21'
    c.filters.value.statut = 'active'
    c.resetFilters()
    expect(c.filters.value).toEqual({ filiere_id: '', niveau_id: '', statut: '' })
    expect(c.filteredClasses.value).toHaveLength(2)
  })

  it('viewClasseDetails navigue vers classe-details', async () => {
    const c = await setup()
    c.viewClasseDetails({ id: 7 })
    expect(push).toHaveBeenCalledWith({ name: 'classe-details', params: { id: 7 } })
  })
})
