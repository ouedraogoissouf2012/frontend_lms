/** Test de rendu ChapterContent (#H4 ≤300) : en-tête, fallback complétion, emits actions. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChapterContent from '@/components/lessons/ChapterContent.vue'

const stubs = {
  ChapterTextRenderer: true,
  ChapterMediaRenderer: true,
  ChapterQuizRenderer: true,
  SlidesViewer: true,
  KnowledgeCheckPlayer: true
}

function mountContent(props = {}) {
  return mount(ChapterContent, {
    props: { chapter: { id: 1, title: 'Intro', content_type: 'text', content: '<p>x</p>' }, chaptersLength: 3, activeChapterIndex: 1, ...props },
    global: { stubs }
  })
}

describe('ChapterContent (#H4)', () => {
  it('affiche le breadcrumb et le titre du chapitre', () => {
    const w = mountContent()
    expect(w.find('.chapter-breadcrumb').text()).toContain('Chapitre 2 sur 3')
    expect(w.find('.chapter-title').text()).toBe('Intro')
  })

  it('affiche le bouton terminer et émet mark-complete', async () => {
    const w = mountContent({ completed: false })
    await w.find('.btn-mark-complete').trigger('click')
    expect(w.emitted('mark-complete')).toHaveLength(1)
    expect(w.find('.completed-badge').exists()).toBe(false)
  })

  it('affiche le badge terminé quand completed', () => {
    const w = mountContent({ completed: true })
    expect(w.find('.completed-badge').exists()).toBe(true)
    expect(w.find('.btn-mark-complete').exists()).toBe(false)
  })

  it('navigation: prev désactivé au premier chapitre, émet next', async () => {
    const w = mountContent({ activeChapterIndex: 0 })
    expect(w.find('.btn-nav.prev').attributes('disabled')).toBeDefined()
    await w.find('.btn-nav.next').trigger('click')
    expect(w.emitted('next')).toHaveLength(1)
  })
})
