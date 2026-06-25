/**
 * Test du composable useTeacherClasses (#H9). klassciService et cache mockes.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const getClasses = vi.fn()
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))
vi.mock('@/services/klassci', () => ({
  klassciService: {
    getClasses: (...a) => getClasses(...a),
    getMatieres: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
    getClasseEtudiants: vi.fn().mockResolvedValue([{ id: 10 }, { id: 11 }])
  }
}))

import { useTeacherClasses } from '@/composables/useTeacherClasses'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherClasses(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherClasses (#H9)', () => {
  it('charge et enrichit les classes au montage', async () => {
    getClasses.mockResolvedValue([{ id: 5, name: '6e A' }])
    const api = await setup()
    expect(api.classes.value).toHaveLength(1)
    const c = api.classes.value[0]
    expect(c.places_occupees).toBe(2)
    expect(c.nb_matieres).toBe(3)
    expect(c.places_totales).toBe(30)
    expect(api.loading.value).toBe(false)
  })

  it('sur erreur, renseigne error', async () => {
    getClasses.mockRejectedValue(new Error('boom'))
    const api = await setup()
    expect(api.error.value).toBe('Impossible de charger vos classes. Veuillez réessayer.')
  })
})
