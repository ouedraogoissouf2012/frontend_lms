/**
 * Test du composable useTeacherMatieres (#H9). lmsService et vue-router mockes.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const push = vi.fn()
const getMyMatieres = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/services/lms', () => ({ default: { getMyMatieres: (...a) => getMyMatieres(...a) } }))

import { useTeacherMatieres } from '@/composables/useTeacherMatieres'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherMatieres(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherMatieres (#H9)', () => {
  it('charge les matieres au montage sur succes', async () => {
    getMyMatieres.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
    const api = await setup()
    expect(api.matieres.value).toHaveLength(2)
    expect(api.loading.value).toBe(false)
  })

  it('sur echec, renseigne error', async () => {
    getMyMatieres.mockResolvedValue({ success: false, message: 'KO' })
    const api = await setup()
    expect(api.error.value).toBe('KO')
  })

  it('navigateToMatiere resout l id et pousse la route', async () => {
    getMyMatieres.mockResolvedValue({ success: true, data: [] })
    const api = await setup()
    push.mockClear()
    api.navigateToMatiere({ matiere_id: 42 })
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 42 } })
    api.navigateToMatiere({ id: 7 })
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 7 } })
  })

  it('navigateToMatiere sans id renseigne error', async () => {
    getMyMatieres.mockResolvedValue({ success: true, data: [] })
    const api = await setup()
    push.mockClear()
    api.navigateToMatiere({})
    expect(push).not.toHaveBeenCalled()
    expect(api.error.value).toBe('Impossible de naviguer vers cette matière')
  })
})
