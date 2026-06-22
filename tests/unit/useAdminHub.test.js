/**
 * Test du composable useAdminHub (#G1 ≤300) : chargement parallèle des compteurs
 * (classes/matières/enseignants) et des stats du dashboard, avec tolérance aux
 * variantes de clés (total_* / nb_*). Service KLASSCI mocké.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/klassci', () => ({
  klassciService: {
    getClasses: () => Promise.resolve([{ id: 1 }, { id: 2 }]),
    getMatieres: () => Promise.resolve([{ id: 1 }, { id: 2 }, { id: 3 }]),
    getEnseignants: () => Promise.resolve([{ id: 1 }]),
    getAdminDashboard: () => Promise.resolve({
      total_etudiants: 42,
      nb_seances: 8,
      total_evaluations: 5,
    }),
  },
}))

import { useAdminHub } from '@/composables/useAdminHub'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminHub(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminHub (#G1)', () => {
  it('compte classes, matières et enseignants', async () => {
    const h = await setup()
    expect(h.stats.value.classes).toBe(2)
    expect(h.stats.value.matieres).toBe(3)
    expect(h.stats.value.enseignants).toBe(1)
    expect(h.loading.value).toBe(false)
  })

  it('lit les stats dashboard avec tolérance des variantes de clés', async () => {
    const h = await setup()
    expect(h.stats.value.etudiants).toBe(42) // total_etudiants
    expect(h.stats.value.seances).toBe(8)    // nb_seances
    expect(h.stats.value.evaluations).toBe(5) // total_evaluations
  })
})
