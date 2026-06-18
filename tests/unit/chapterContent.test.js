/**
 * Tests de la logique pure du contenu de chapitre (#28 — ChapterManager.vue).
 */
import { describe, it, expect } from 'vitest'
import { getChapterContentTypeLabel, getChapterContentPreview } from '@/utils/chapterContent'

describe('utils/chapterContent — getChapterContentTypeLabel', () => {
  it('mappe les types connus', () => {
    expect(getChapterContentTypeLabel('text')).toBe('Texte / Markdown')
    expect(getChapterContentTypeLabel('pdf')).toBe('PDF')
    expect(getChapterContentTypeLabel('quiz')).toBe('Quiz / Testez vos connaissances')
  })
  it('fallback : type brut si inconnu', () => {
    expect(getChapterContentTypeLabel('audio')).toBe('audio')
  })
})

describe('utils/chapterContent — getChapterContentPreview', () => {
  it('vide si pas de contenu', () => {
    expect(getChapterContentPreview('')).toBe('')
    expect(getChapterContentPreview(null)).toBe('')
  })
  it('renvoie tel quel si <= 150 caractères', () => {
    const short = 'a'.repeat(150)
    expect(getChapterContentPreview(short)).toBe(short)
  })
  it('tronque à 150 + "..." si plus long', () => {
    const long = 'a'.repeat(200)
    const out = getChapterContentPreview(long)
    expect(out).toBe('a'.repeat(150) + '...')
    expect(out.endsWith('...')).toBe(true)
  })
})
