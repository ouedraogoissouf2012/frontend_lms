/**
 * Test du composable useLessonEditor (#H4) : isEditMode, ressources, sauvegarde
 * (création vs édition) et suppression. vue-router + services mockés, confirm/alert stubbés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
const go = vi.fn()
let routeParams = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: routeParams }),
  useRouter: () => ({ push, go })
}))

const createLesson = vi.fn().mockResolvedValue({ success: true })
const updateLesson = vi.fn().mockResolvedValue({ success: true })
const deleteLessonApi = vi.fn().mockResolvedValue({ success: true })
const getLesson = vi.fn().mockResolvedValue({ success: true, data: { title: 'X', type: 'cours', status: 'draft' } })
vi.mock('@/services/lesson', () => ({
  default: {
    getLesson: (...a) => getLesson(...a),
    createLesson: (...a) => createLesson(...a),
    updateLesson: (...a) => updateLesson(...a),
    deleteLesson: (...a) => deleteLessonApi(...a)
  }
}))
vi.mock('@/services/chapter', () => ({ default: { getChapters: vi.fn().mockResolvedValue({ success: true, data: [] }) } }))
vi.mock('@/services/klassci', () => ({
  klassciService: { getMatieres: vi.fn().mockResolvedValue([]), getClasses: vi.fn().mockResolvedValue([]) }
}))
vi.mock('@/services/toast', () => ({ toast: { error: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: (e) => ({ userMessage: String(e) }) }))

import { useLessonEditor } from '@/composables/useLessonEditor'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useLessonEditor(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useLessonEditor (#H4)', () => {
  beforeEach(() => {
    routeParams = {}
    push.mockClear(); go.mockClear()
    createLesson.mockClear(); updateLesson.mockClear(); deleteLessonApi.mockClear()
    vi.stubGlobal('alert', vi.fn())
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('isEditMode = false sans id de route', async () => {
    const c = await setup()
    expect(c.isEditMode.value).toBe(false)
  })

  it('addResource ajoute une ressource ordonnée et removeResource la retire', async () => {
    const c = await setup()
    c.addResource()
    c.addResource()
    expect(c.form.value.resources).toHaveLength(2)
    expect(c.form.value.resources[1].order).toBe(1)
    c.removeResource(0)
    expect(c.form.value.resources).toHaveLength(1)
    expect(c.form.value.resources[0].order).toBe(0)
  })

  it('saveLesson crée en mode création puis redirige', async () => {
    const c = await setup()
    c.form.value.title = 'Nouvelle'
    await c.saveLesson()
    expect(createLesson).toHaveBeenCalled()
    expect(updateLesson).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/teacher/lessons')
  })

  it('saveLesson met à jour en mode édition', async () => {
    routeParams = { id: '9' }
    const c = await setup()
    await c.saveLesson()
    expect(updateLesson).toHaveBeenCalledWith('9', expect.any(Object))
    expect(createLesson).not.toHaveBeenCalled()
  })

  it('deleteLesson supprime après confirmation et redirige', async () => {
    routeParams = { id: '9' }
    const c = await setup()
    await c.deleteLesson()
    expect(deleteLessonApi).toHaveBeenCalledWith('9')
    expect(push).toHaveBeenCalledWith('/teacher/lessons')
  })
})
