/**
 * Tests de la logique pure de gestion des chapitres (G5 — ChapterManager.vue).
 *
 * Couvre la fabrique de chapitre vide et le builder de payload extraits du
 * god-component, garantissant la parité exacte des champs envoyés à l'API.
 */
import { describe, it, expect } from 'vitest'
import { createEmptyChapter, buildChapterPayload } from '@/utils/chapterManager'

describe('utils/chapterManager — createEmptyChapter', () => {
  it('crée un chapitre vide avec les valeurs par défaut attendues', () => {
    const chapter = createEmptyChapter(2, 7)
    expect(chapter).toEqual({
      tempId: 7,
      title: '',
      content_type: 'text',
      content: '',
      video_url: '',
      external_link: '',
      autoplay_video: false,
      order: 2,
      isEditing: true,
      isNew: true
    })
  })

  it('reporte order et tempId tels quels (aucune dérivation interne)', () => {
    const chapter = createEmptyChapter(0, 1)
    expect(chapter.order).toBe(0)
    expect(chapter.tempId).toBe(1)
    expect(chapter.isNew).toBe(true)
    expect(chapter.isEditing).toBe(true)
  })
})

describe('utils/chapterManager — buildChapterPayload', () => {
  it("ne retient que les champs persistés (pas d'état UI)", () => {
    const chapter = {
      id: 12,
      title: 'Intro',
      content_type: 'video',
      content: 'desc',
      video_url: 'https://x',
      external_link: '',
      autoplay_video: true,
      order: 3,
      // champs UI qui ne doivent PAS partir au backend
      isEditing: true,
      isNew: false,
      selectedFile: {},
      _originalState: {}
    }
    expect(buildChapterPayload(chapter)).toEqual({
      title: 'Intro',
      content_type: 'video',
      content: 'desc',
      video_url: 'https://x',
      external_link: '',
      autoplay_video: true,
      order: 3
    })
  })

  it('préserve les valeurs falsy sans les remplacer', () => {
    const payload = buildChapterPayload({
      title: '',
      content_type: 'text',
      content: '',
      video_url: '',
      external_link: '',
      autoplay_video: false,
      order: 0
    })
    expect(payload.autoplay_video).toBe(false)
    expect(payload.order).toBe(0)
    expect(payload.content).toBe('')
  })
})
