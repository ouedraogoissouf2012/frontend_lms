/**
 * Test du composable useLessonChapters (#H4 ≤300) : chargement leçon, lecture seule,
 * publication et navigation. vue-router, lessonService, toast et errorHandler mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
const back = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back, resolve: () => ({ href: '/lessons/7' }) }),
  useRoute: () => ({ params: { id: '7' }, query: {} })
}))

const getLesson = vi.fn(() => Promise.resolve({ success: true, data: { id: 7, title: 'Leçon 7' } }))
const publishLessonApi = vi.fn(() => Promise.resolve({ success: true }))
// confirm() natif -> useConfirm().confirm() (async) résolu de façon déterministe (Lot F3).
const confirmMock = vi.fn(() => Promise.resolve(true))

vi.mock('@/services/lesson', () => ({
  default: {
    getLesson: (...a) => getLesson(...a),
    publishLesson: (...a) => publishLessonApi(...a)
  }
}))
vi.mock('@/composables/useToast', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn() } }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: confirmMock, accept: vi.fn(), cancel: vi.fn(), state: {} }) }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: () => ({ userMessage: 'err' }) }))

import { useLessonChapters } from '@/composables/useLessonChapters'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useLessonChapters(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useLessonChapters (#H4)', () => {
  beforeEach(() => { push.mockClear(); back.mockClear(); getLesson.mockClear(); publishLessonApi.mockClear(); confirmMock.mockResolvedValue(true) })

  it('charge la leçon au montage et expose lessonId depuis la route', async () => {
    const c = await setup()
    expect(c.lessonId.value).toBe(7)
    expect(c.lesson.value.title).toBe('Leçon 7')
    expect(c.loadingLesson.value).toBe(false)
    expect(c.isReadOnly.value).toBe(false)
  })

  it('goBack redirige vers la matière quand matiere_id est présent', async () => {
    const c = await setup()
    c.lesson.value = { matiere_id: 12 }
    c.goBack()
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 12 } })
    expect(back).not.toHaveBeenCalled()
  })

  it('goBack retombe sur router.back sans matiere_id', async () => {
    const c = await setup()
    c.lesson.value = { id: 7 }
    c.goBack()
    expect(back).toHaveBeenCalled()
  })

  it('publishLesson publie après confirmation et redirige', async () => {
    confirmMock.mockResolvedValue(true)
    const c = await setup()
    c.lesson.value = { matiere_id: 5 }
    await c.publishLesson()
    expect(publishLessonApi).toHaveBeenCalledWith(7)
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 5 } })
    vi.unstubAllGlobals()
  })

  it('publishLesson annulé ne publie pas', async () => {
    confirmMock.mockResolvedValue(false)
    const c = await setup()
    await c.publishLesson()
    expect(publishLessonApi).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
