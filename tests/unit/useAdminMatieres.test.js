/**
 * Test du composable useAdminMatieres (#G1 ≤300) : chargement matières + structure,
 * filtrage (recherche/filière/niveau via @/utils/matieres), regroupement par niveau,
 * statistiques et pilotage des modales niveau/matière. Services KLASSCI + cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/cache', () => ({
  readCache: () => null,
  writeCache: () => {},
  clearCache: () => {},
}))

const MATIERES = [
  {
    id: 1, nom: 'Mathématiques', code: 'MATH', coefficient: 4, heures_total: 30,
    nb_seances_programmees: 10,
    combinaisons: [{ filiere: { id: 11, nom: 'Scientifique' }, niveau: { id: 21, nom: '6e', code: '6E' } }],
  },
  {
    id: 2, nom: 'Histoire', code: 'HIST', coefficient: 2, heures_total: 20,
    nb_seances_programmees: 5,
    combinaisons: [{ filiere: { id: 12, nom: 'Littéraire' }, niveau: { id: 22, nom: '5e', code: '5E' } }],
  },
]

vi.mock('@/services/klassci', () => ({
  klassciService: {
    getAdminMatieres: () => Promise.resolve({ success: true, data: { matieres: MATIERES } }),
    getStructure: () => Promise.resolve({
      filieres: [{ id: 11, nom: 'Scientifique' }, { id: 12, nom: 'Littéraire' }],
      niveaux_etude: [{ id: 21, nom: '6e', code: '6E' }, { id: 22, nom: '5e', code: '5E' }],
    }),
  },
}))

import { useAdminMatieres } from '@/composables/useAdminMatieres'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminMatieres(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminMatieres (#G1)', () => {
  it('charge matières + structure (filières/niveaux) et calcule les stats', async () => {
    const m = await setup()
    expect(m.matieres.value).toHaveLength(2)
    expect(m.filieres.value).toHaveLength(2)
    expect(m.niveaux.value).toHaveLength(2)
    expect(m.loading.value).toBe(false)
    expect(m.stats.value.total).toBe(2)
    expect(m.stats.value.totalHeures).toBe(50)
    expect(m.stats.value.totalSeances).toBe(15)
  })

  it('filtre par recherche (nom/code)', async () => {
    const m = await setup()
    m.filters.value.search = 'hist'
    expect(m.filteredMatieres.value).toHaveLength(1)
    expect(m.filteredMatieres.value[0].nom).toBe('Histoire')
  })

  it('filtre par filière', async () => {
    const m = await setup()
    m.filters.value.filiere_id = 11
    expect(m.filteredMatieres.value).toHaveLength(1)
    expect(m.filteredMatieres.value[0].id).toBe(1)
  })

  it('filtre par niveau', async () => {
    const m = await setup()
    m.filters.value.niveau_id = 22
    expect(m.filteredMatieres.value).toHaveLength(1)
    expect(m.filteredMatieres.value[0].id).toBe(2)
  })

  it('regroupe les matières filtrées par niveau', async () => {
    const m = await setup()
    const groups = m.filteredNiveauxWithMatieres.value
    expect(groups).toHaveLength(2)
    const codes = groups.map((g) => g.niveau.code).sort()
    expect(codes).toEqual(['5E', '6E'])
  })

  it('resetFilters remet les trois filtres à vide', async () => {
    const m = await setup()
    m.filters.value.search = 'x'
    m.filters.value.filiere_id = 11
    m.filters.value.niveau_id = 22
    m.resetFilters()
    expect(m.filters.value).toEqual({ search: '', filiere_id: '', niveau_id: '' })
  })

  it('view/close matiere pilotent selectedMatiere + showMatiereModal', async () => {
    const m = await setup()
    m.viewMatiereDetails({ id: 9 })
    expect(m.selectedMatiere.value).toEqual({ id: 9 })
    expect(m.showMatiereModal.value).toBe(true)
    m.closeMatiereModal()
    expect(m.selectedMatiere.value).toBe(null)
    expect(m.showMatiereModal.value).toBe(false)
  })

  it('view/close niveau pilotent selectedNiveau + showNiveauModal', async () => {
    const m = await setup()
    m.viewNiveauDetails({ niveau: { id: 21 } })
    expect(m.selectedNiveau.value).toEqual({ niveau: { id: 21 } })
    expect(m.showNiveauModal.value).toBe(true)
    m.closeNiveauModal()
    expect(m.selectedNiveau.value).toBe(null)
    expect(m.showNiveauModal.value).toBe(false)
  })
})
