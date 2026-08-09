/**
 * Test du composable useStudentLessonView (#H4 ≤300) : chargement (leçon+chapitres+
 * progression+quiz), progression globale et navigation chapitres. Services + router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ params: { id: '5' } })
}))

const getLesson = vi.fn()
const apiGet = vi.fn()
const markAsCompleted = vi.fn()
const toastError = vi.fn()
vi.mock('@/services/lesson', () => ({
  default: { getLesson: (...a) => getLesson(...a), markComplete: vi.fn(), updateProgress: vi.fn() }
}))
vi.mock('@/services/api', () => ({ default: { get: (...a) => apiGet(...a) } }))
vi.mock('@/services/chapterProgress', () => ({
  default: { markAsCompleted: (...a) => markAsCompleted(...a), updateTimeSpent: vi.fn() }
}))
vi.mock('@/services/toast', () => ({
  toast: { error: (...a) => toastError(...a), success: vi.fn(), warning: vi.fn() }
}))

import { useStudentLessonView } from '@/composables/useStudentLessonView'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useStudentLessonView(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useStudentLessonView (#H4)', () => {
  beforeEach(() => {
    getLesson.mockReset(); apiGet.mockReset(); push.mockClear()
    markAsCompleted.mockReset(); toastError.mockClear()
  })

  it('charge leçon + chapitres par id de route', async () => {
    getLesson.mockResolvedValue({ success: true, data: { id: 5, title: 'L' } })
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1, content_type: 'text' }] })
    const c = await setup()
    expect(getLesson).toHaveBeenCalledWith(5)
    expect(apiGet).toHaveBeenCalledWith('/lessons/5/chapters')
    expect(c.chapters.value).toHaveLength(1)
    expect(c.lessonId.value).toBe(5)
  })

  it('overallProgress vaut 0 sans chapitre, et reflète les chapitres terminés', async () => {
    getLesson.mockResolvedValue({ success: true, data: {} })
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
    const c = await setup()
    expect(c.overallProgress.value).toBe(0)
    c.completedChapters.value = new Set([1])
    expect(c.overallProgress.value).toBe(50)
  })

  it('prev/next bornent l\'index de chapitre actif', async () => {
    getLesson.mockResolvedValue({ success: true, data: {} })
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
    const c = await setup()
    c.prevChapter()
    expect(c.activeChapterIndex.value).toBe(0)
    c.nextChapter()
    expect(c.activeChapterIndex.value).toBe(1)
    c.nextChapter()
    expect(c.activeChapterIndex.value).toBe(1)
  })

  it('goBack revient à la liste des cours', async () => {
    getLesson.mockResolvedValue({ success: true, data: {} })
    apiGet.mockResolvedValue({ success: true, data: [] })
    const c = await setup()
    c.goBack()
    expect(push).toHaveBeenCalledWith({ name: 'student-courses' })
  })

  it('message spécifique 403 quand la leçon n\'est pas disponible', async () => {
    getLesson.mockRejectedValue({ response: { status: 403 } })
    apiGet.mockResolvedValue({ success: true, data: [] })
    const c = await setup()
    expect(c.error.value).toBe("Cette leçon n'est pas encore disponible")
  })

  // #233 : l'UI ne doit JAMAIS afficher un chapitre « terminé » si le serveur a
  // échoué (progression faussée, désynchronisée au rechargement).
  it('#233 — échec API : ne marque PAS le chapitre complété et informe l\'utilisateur', async () => {
    getLesson.mockResolvedValue({ success: true, data: {} })
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
    markAsCompleted.mockRejectedValue({ userMessage: 'Réseau indisponible' })
    const c = await setup()

    await c.markChapterComplete()

    expect(c.isChapterCompleted(1)).toBe(false)
    expect(c.completedChapters.value.has(1)).toBe(false)
    expect(toastError).toHaveBeenCalledWith('Réseau indisponible')
  })

  it('#233 — succès API : marque le chapitre complété sans toast d\'erreur', async () => {
    getLesson.mockResolvedValue({ success: true, data: {} })
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
    markAsCompleted.mockResolvedValue({ success: true })
    const c = await setup()

    await c.markChapterComplete()

    expect(c.isChapterCompleted(1)).toBe(true)
    expect(toastError).not.toHaveBeenCalled()
  })
})
