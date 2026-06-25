/**
 * Test du composable useLessonForm (#H4 ≤300) : création/édition d'une leçon dans la
 * liste partagée + reset à la fermeture. Cache mocké, alert stubbé.
 */
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/cache', () => ({ writeCache: vi.fn() }))

import { useLessonForm } from '@/composables/useLessonForm'

describe('useLessonForm (#H4)', () => {
  beforeEach(() => { vi.stubGlobal('alert', vi.fn()) })

  it('refuse de sauvegarder sans matière ni titre', async () => {
    const lessons = ref([])
    const f = useLessonForm(lessons)
    await f.saveLesson()
    expect(lessons.value).toHaveLength(0)
    expect(globalThis.alert).toHaveBeenCalled()
  })

  it('crée une nouvelle leçon en tête de liste puis réinitialise le formulaire', async () => {
    const lessons = ref([{ id: 1 }])
    const f = useLessonForm(lessons)
    f.lessonForm.matiere_id = 7
    f.lessonForm.title = 'Nouvelle'
    await f.saveLesson()
    expect(lessons.value).toHaveLength(2)
    expect(lessons.value[0].title).toBe('Nouvelle')
    expect(f.lessonForm.title).toBe('')
    expect(f.showCreateModal.value).toBe(false)
  })

  it('met à jour une leçon existante en mode édition', async () => {
    const lessons = ref([{ id: 5, title: 'Ancien', status: 'draft' }])
    const f = useLessonForm(lessons)
    f.editingLesson.value = { id: 5 }
    f.lessonForm.matiere_id = 3
    f.lessonForm.title = 'Modifié'
    await f.saveLesson()
    expect(lessons.value[0].title).toBe('Modifié')
    expect(lessons.value).toHaveLength(1)
  })
})
