/**
 * Test du composable useAdminClasses (#G1 ≤300) : chargement + enrichissement des
 * classes, filtres (filière/niveau/statut), stats, reset et navigation. Services
 * KLASSCI, cache et vue-router mockés. Calqué sur useAdminUsers.test.js.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, it, expect, vi } from 'vitest'

const h = vi.hoisted(() => ({
  push: vi.fn(),
  readCache: vi.fn(),
  writeCache: vi.fn(),
  getClasses: vi.fn(),
  getMatieres: vi.fn(),
  getAdminMatieres: vi.fn(),
  getStructure: vi.fn(),
  getClasseEtudiants: vi.fn(),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: h.push }) }))
vi.mock('@/services/cache', () => ({ readCache: h.readCache, writeCache: h.writeCache }))
vi.mock('@/services/klassci', () => ({
  klassciService: {
    getClasses: h.getClasses,
    getMatieres: h.getMatieres,
    getAdminMatieres: h.getAdminMatieres,
    getStructure: h.getStructure,
    getClasseEtudiants: h.getClasseEtudiants,
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
  beforeEach(() => {
    h.push.mockReset()
    h.readCache.mockReset().mockReturnValue(null)
    h.writeCache.mockReset()
    h.getClasses.mockReset().mockResolvedValue([
      { id: 1, name: '6e A', is_active: true, filiere: { id: 11 }, niveau: { id: 21 }, places_occupees: 2, effectif_max: 40 },
      { id: 2, name: '5e B', is_active: false, filiere: { id: 12 }, niveau: { id: 22 }, nb_etudiants: 1 },
    ])
    h.getMatieres.mockReset().mockResolvedValue([
      { id: 1, classes: [{ id: 1 }] },
      { id: 2, classe_id: 1 },
      { id: 3, classe_id: 2 },
    ])
    h.getAdminMatieres.mockReset().mockResolvedValue({
      success: true,
      data: {
        matieres: [
          { id: 1, classes: [{ id: 1 }] },
          { id: 2, classe_id: 1 },
          { id: 3, classe_id: 2 },
        ]
      }
    })
    h.getStructure.mockReset().mockResolvedValue({
      filieres: [{ id: 11, nom: 'Sciences' }, { id: 12, nom: 'Lettres' }],
      niveaux: [{ id: 21, nom: 'Niv 1' }, { id: 22, nom: 'Niv 2' }],
    })
    h.getClasseEtudiants.mockReset().mockImplementation((id) =>
      Promise.resolve(id === 1 ? [{ id: 100 }, { id: 101 }] : [{ id: 200 }])
    )
  })

  it('charge et enrichit les classes (compteurs étudiants/matières)', async () => {
    const c = await setup()
    expect(c.classes.value).toHaveLength(2)
    expect(c.loading.value).toBe(false)
    expect(c.classes.value[0].places_occupees).toBe(2)
    expect(c.classes.value[0].nb_matieres).toBe(2)
    expect(c.classes.value[1].nb_matieres).toBe(1)
  })

  it('affiche les classes sans appeler les rosters étudiants détaillés', async () => {
    h.getClasseEtudiants.mockRejectedValue(new Error('endpoint down'))

    const c = await setup()

    expect(c.loading.value).toBe(false)
    expect(c.classes.value).toHaveLength(2)
    expect(h.getClasseEtudiants).not.toHaveBeenCalled()
  })

  it('calcule les stats (total, étudiants, matières, actives)', async () => {
    const c = await setup()
    expect(c.stats.value.total).toBe(2)
    expect(c.stats.value.totalEtudiants).toBe(3) // 2 + 1
    expect(c.stats.value.totalMatieres).toBe(3) // matières uniques globales
    expect(c.stats.value.actives).toBe(1)
  })

  it('filtre par filière', async () => {
    const c = await setup()
    c.filters.value.filiere_id = '11'
    expect(c.filteredClasses.value).toHaveLength(1)
    expect(c.filteredClasses.value[0].id).toBe(1)
  })

  it('filtre par filière malgré un id chaîne (types KLASSCI incohérents)', async () => {
    h.getClasses.mockResolvedValue([
      { id: 1, name: '6e A', is_active: true, filiere: { id: '11' }, niveau: { id: 21 }, places_occupees: 2 },
      { id: 2, name: '5e B', is_active: false, filiere: { id: 12 }, niveau: { id: 22 }, nb_etudiants: 1 },
    ])
    const c = await setup()
    c.filters.value.filiere_id = 11
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
    expect(h.push).toHaveBeenCalledWith({ name: 'classe-details', params: { id: 7 } })
  })

  it('normalise les enveloppes API et ignore les éléments invalides (#13)', async () => {
    h.getClasses.mockResolvedValue({ data: [
      null,
      { id: 1, name: '6e A', is_active: true, filiere: { id: 11 }, niveau: { id: 21 }, nb_etudiants: 1 },
    ] })
    h.getMatieres.mockResolvedValue({ matieres: [null, { id: 1, classe_id: 1 }, { id: 2, classe_id: 999 }] })
    h.getStructure.mockResolvedValue({
      filieres: [null, { id: 11, nom: 'Sciences' }],
      niveaux_etude: [undefined, { id: 21, nom: 'Niv 1' }],
    })
    h.getClasseEtudiants.mockResolvedValue({ etudiants: [null, { id: 100 }] })

    const c = await setup()
    c.filters.value.statut = 'active'

    expect(c.classes.value).toHaveLength(1)
    expect(c.filteredClasses.value).toHaveLength(1)
    expect(c.stats.value).toEqual({ total: 1, totalEtudiants: 1, totalMatieres: 2, actives: 1 })
    expect(c.filieres.value).toEqual([{ id: 11 }])
    expect(c.niveaux.value).toEqual([{ id: 21 }])
    expect(c.matieres.value).toEqual([{ id: 1, classe_id: 1 }, { id: 2, classe_id: 999 }])
  })

  it('normalise un cache non-tableau sans casser filteredClasses (#13)', async () => {
    h.readCache.mockReturnValue({
      classes: { id: 1 },
      filieres: null,
      niveaux: 'bad',
      matieres: {},
    })
    h.getClasses.mockResolvedValue({})
    h.getMatieres.mockResolvedValue(null)
    h.getAdminMatieres.mockResolvedValue({ success: true, data: { matieres: [] } })
    h.getStructure.mockResolvedValue({ filieres: {}, niveaux: {} })

    const c = await setup()
    c.filters.value.filiere_id = '11'

    expect(c.classes.value).toEqual([])
    expect(c.filteredClasses.value).toEqual([])
    expect(c.stats.value.total).toBe(0)
  })

  it('utilise /proxy/matieres pour les compteurs par classe', async () => {
    h.getMatieres.mockResolvedValue([
      { id: 1, combinaisons: [{ filiere: { id: 11 }, niveau: { id: 21 } }] },
      { id: 2, combinaisons: [{ filiere: { id: 12 }, niveau: { id: 22 } }] },
    ])

    const c = await setup()

    expect(h.getMatieres).toHaveBeenCalled()
    expect(h.getAdminMatieres).not.toHaveBeenCalled()
    expect(c.classes.value[0].nb_matieres).toBe(1)
    expect(c.classes.value[1].nb_matieres).toBe(1)
  })

  it('affiche les classes même si les matières sont indisponibles', async () => {
    h.getMatieres.mockRejectedValue(new Error('proxy down'))

    const c = await setup()

    expect(c.error.value).toBe(null)
    expect(c.loading.value).toBe(false)
    expect(c.classes.value).toHaveLength(2)
    expect(c.matieres.value).toEqual([])
    expect(c.filieres.value).toEqual([{ id: 11 }, { id: 12 }])
    expect(c.niveaux.value).toEqual([{ id: 21 }, { id: 22 }])
    expect(h.getStructure).not.toHaveBeenCalled()
  })
})
