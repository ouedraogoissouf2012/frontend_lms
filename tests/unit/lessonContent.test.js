/**
 * Tests de la logique pure du contenu de leçon (#28 — StudentLessonView.vue).
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/constants/http', () => ({ apiOrigin: () => 'http://api.test' }))

import {
  getVideoEmbedUrl,
  getSlideUrl,
  getPdfUrl,
  getContentTypeLabel,
  getContentTypeIcon,
  isChapterContentEmpty
} from '@/utils/lessonContent'

describe('utils/lessonContent — getVideoEmbedUrl', () => {
  it('YouTube (watch / youtu.be) → embed', () => {
    expect(getVideoEmbedUrl('https://www.youtube.com/watch?v=abc123DEF45')).toBe('https://www.youtube.com/embed/abc123DEF45?rel=0')
    expect(getVideoEmbedUrl('https://youtu.be/abc123DEF45')).toBe('https://www.youtube.com/embed/abc123DEF45?rel=0')
  })
  it('Vimeo → player', () => {
    expect(getVideoEmbedUrl('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456')
  })
  it('null si vide ou non reconnu', () => {
    expect(getVideoEmbedUrl('')).toBeNull()
    expect(getVideoEmbedUrl('https://example.com/x')).toBeNull()
  })
})

describe('utils/lessonContent — getSlideUrl / getPdfUrl', () => {
  it('slide absolue inchangée, relative préfixée storage', () => {
    expect(getSlideUrl('https://cdn/x.png')).toBe('https://cdn/x.png')
    expect(getSlideUrl('slides/x.png')).toBe('http://api.test/storage/slides/x.png')
    expect(getSlideUrl('')).toBe('')
  })
  it('pdf : pdf_url prioritaire, fallback file_converted_path, sinon vide', () => {
    expect(getPdfUrl({ pdf_url: 'https://cdn/a.pdf' })).toBe('https://cdn/a.pdf')
    expect(getPdfUrl({ file_converted_path: 'docs/a.pdf' })).toBe('http://api.test/storage/docs/a.pdf')
    expect(getPdfUrl({})).toBe('')
  })
})

describe('utils/lessonContent — mappers de type', () => {
  it('label + fallback', () => {
    expect(getContentTypeLabel('video')).toBe('Vidéo')
    expect(getContentTypeLabel('inconnu')).toBe('inconnu')
  })
  it('icône + fallback', () => {
    expect(getContentTypeIcon('pdf')).toBe('fa fa-file-pdf-o')
    expect(getContentTypeIcon('inconnu')).toBe('fa fa-file-o')
  })
})

describe('utils/lessonContent — isChapterContentEmpty', () => {
  it('true si pas de chapitre', () => {
    expect(isChapterContentEmpty(null)).toBe(true)
  })
  it('par type de contenu', () => {
    expect(isChapterContentEmpty({ content_type: 'text', content: '' })).toBe(true)
    expect(isChapterContentEmpty({ content_type: 'text', content: 'x' })).toBe(false)
    expect(isChapterContentEmpty({ content_type: 'video', video_url: 'u' })).toBe(false)
    expect(isChapterContentEmpty({ content_type: 'powerpoint', slides_images: [] })).toBe(true)
    expect(isChapterContentEmpty({ content_type: 'pdf', pdf_url: null, file_converted_path: 'p' })).toBe(false)
    expect(isChapterContentEmpty({ content_type: 'link', external_link: '' })).toBe(true)
  })
  it('quiz : dépend de hasQuiz', () => {
    expect(isChapterContentEmpty({ content_type: 'quiz' }, false)).toBe(true)
    expect(isChapterContentEmpty({ content_type: 'quiz' }, true)).toBe(false)
  })
})
