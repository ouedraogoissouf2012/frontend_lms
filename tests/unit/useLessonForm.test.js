/**
 * Test du composable useLessonForm (#H4 ≤300).
 * #236 : la sauvegarde appelle désormais le VRAI service (createLesson/updateLesson)
 * et insère la leçon renvoyée par le serveur (id réel) — plus de leçon fabriquée
 * (id: Date.now()) « fantôme » écrite dans le cache sans être persistée.
 * Cache + service mockés, alert stubbé.
 */
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/cache', () => ({ writeCache: vi.fn() }))

const lessonMock = vi.hoisted(() => ({
  createLesson: vi.fn(),
  updateLesson: vi.fn(),
}))
vi.mock('@/services/lesson', () => ({ default: lessonMock }))

import { useLessonForm } from '@/composables/useLessonForm'

describe('useLessonForm (#H4 / #236)', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn())
    lessonMock.createLesson.mockReset()
    lessonMock.updateLesson.mockReset()
  })

  it('refuse de sauvegarder sans matière ni titre (pas d\'appel service)', async () => {
    const lessons = ref([])
    const f = useLessonForm(lessons)
    await f.saveLesson()
    expect(lessons.value).toHaveLength(0)
    expect(lessonMock.createLesson).not.toHaveBeenCalled()
    expect(globalThis.alert).toHaveBeenCalled()
  })

  it('crée via l\'API et insère la leçon RENVOYÉE par le serveur (id réel)', async () => {
    lessonMock.createLesson.mockResolvedValue({ success: true, data: { id: 99, title: 'Nouvelle' } })
    const lessons = ref([{ id: 1 }])
    const f = useLessonForm(lessons)
    f.lessonForm.matiere_id = 7
    f.lessonForm.title = 'Nouvelle'

    await f.saveLesson()

    expect(lessonMock.createLesson).toHaveBeenCalledWith(expect.objectContaining({ matiere_id: 7, title: 'Nouvelle' }))
    expect(lessons.value).toHaveLength(2)
    expect(lessons.value[0]).toEqual({ id: 99, title: 'Nouvelle' }) // id serveur, pas Date.now()
    expect(f.lessonForm.title).toBe('')
    expect(f.showCreateModal.value).toBe(false)
  })

  it('ne crée aucune leçon fantôme si l\'API échoue', async () => {
    lessonMock.createLesson.mockResolvedValue({ success: false, message: 'Refusé' })
    const lessons = ref([{ id: 1 }])
    const f = useLessonForm(lessons)
    f.lessonForm.matiere_id = 7
    f.lessonForm.title = 'Nouvelle'

    await f.saveLesson()

    expect(lessons.value).toHaveLength(1) // rien ajouté
    expect(globalThis.alert).toHaveBeenCalled()
    expect(f.showCreateModal.value).toBe(false) // état initial inchangé (modale non ouverte ici)
  })

  it('met à jour via l\'API en mode édition', async () => {
    lessonMock.updateLesson.mockResolvedValue({ success: true, data: { id: 5, title: 'Modifié' } })
    const lessons = ref([{ id: 5, title: 'Ancien', status: 'draft' }])
    const f = useLessonForm(lessons)
    f.editingLesson.value = { id: 5 }
    f.lessonForm.matiere_id = 3
    f.lessonForm.title = 'Modifié'

    await f.saveLesson()

    expect(lessonMock.updateLesson).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Modifié' }))
    expect(lessons.value[0].title).toBe('Modifié')
    expect(lessons.value).toHaveLength(1)
  })
})
