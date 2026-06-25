/**
 * Test du composable useStudentCourses (#G1 ≤300) : chargement des cours au
 * montage, filtres disponibles, reset, et navigation. Services KLASSCI + toast
 * + vue-router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getMyCourses = vi.fn()
const push = vi.fn()
const toastError = vi.fn()

vi.mock('@/services/klassci', () => ({
  klassciService: { getMyCourses: (...args) => getMyCourses(...args) },
}))
vi.mock('@/services/toast', () => ({
  toast: { error: (...args) => toastError(...args) },
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

import { useStudentCourses } from '@/composables/useStudentCourses'

const RESPONSE = {
  data: [{ id: 'c1', title: 'Algèbre' }],
  filters: {
    matieres: [{ id: 'm1', name: 'Maths' }],
    enseignants: [{ id: 'e1', name: 'Prof X' }],
  },
}

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useStudentCourses(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => {
  getMyCourses.mockReset()
  push.mockReset()
  toastError.mockReset()
  getMyCourses.mockResolvedValue(RESPONSE)
})

describe('useStudentCourses (#G1)', () => {
  it('charge les cours et les filtres disponibles au montage', async () => {
    const c = await setup()
    expect(getMyCourses).toHaveBeenCalledWith({})
    expect(c.courses.value).toHaveLength(1)
    expect(c.courses.value[0].title).toBe('Algèbre')
    expect(c.availableFilters.value.matieres).toHaveLength(1)
    expect(c.availableFilters.value.enseignants).toHaveLength(1)
    expect(c.loading.value).toBe(false)
    expect(c.error.value).toBe(null)
  })

  it('applyFilters envoie les filtres actifs et ne réécrit pas availableFilters', async () => {
    const c = await setup()
    getMyCourses.mockResolvedValueOnce({ data: [], filters: { matieres: [], enseignants: [] } })
    c.selectedMatiere.value = 'm1'
    c.applyFilters()
    await flushPromises()
    expect(getMyCourses).toHaveBeenLastCalledWith({ matiere_id: 'm1' })
    // availableFilters conservés car un filtre est actif
    expect(c.availableFilters.value.matieres).toHaveLength(1)
  })

  it('resetFilters réinitialise les selects et recharge', async () => {
    const c = await setup()
    c.selectedMatiere.value = 'm1'
    c.selectedEnseignant.value = 'e1'
    c.resetFilters()
    await flushPromises()
    expect(c.selectedMatiere.value).toBe('')
    expect(c.selectedEnseignant.value).toBe('')
    expect(getMyCourses).toHaveBeenLastCalledWith({})
  })

  it('navigateToCourse pousse la route lesson-details', async () => {
    const c = await setup()
    c.navigateToCourse({ id: 'c1' })
    expect(push).toHaveBeenCalledWith({ name: 'lesson-details', params: { id: 'c1' } })
  })

  it('navigateToCourse sans id appelle toast.error', async () => {
    const c = await setup()
    c.navigateToCourse({})
    expect(push).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith('Impossible de naviguer vers ce cours')
  })

  it('met error en cas d\'échec de chargement', async () => {
    getMyCourses.mockRejectedValueOnce(new Error('boom'))
    const c = await setup()
    expect(c.error.value).toBe('Impossible de charger vos cours. Veuillez réessayer.')
    expect(c.loading.value).toBe(false)
  })
})
