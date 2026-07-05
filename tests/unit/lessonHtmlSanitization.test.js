import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChapterTextRenderer from '@/components/lessons/ChapterTextRenderer.vue'
import ChapterViewMode from '@/components/lessons/ChapterViewMode.vue'
import LessonRichTextEditor from '@/components/lessons/LessonRichTextEditor.vue'

const dangerousLessonHtml = [
  '<h2>Titre</h2>',
  '<p><strong>Contenu</strong> utile</p>',
  '<img src="x" onerror="alert(1)">',
  '<script>alert(2)</script>',
  '<a href="javascript:alert(3)">lien</a>',
  '<table><tr><td>cellule</td></tr></table>',
].join('')

function expectSafeLessonHtml(html) {
  expect(html).toContain('Titre')
  expect(html).toContain('<strong>Contenu</strong>')
  expect(html).toContain('<td>cellule</td>')
  expect(html).not.toMatch(/<script/i)
  expect(html).not.toMatch(/onerror/i)
  expect(html).not.toMatch(/javascript:/i)
  expect(html).not.toMatch(/alert\(/i)
}

describe('contenu de leçon rendu via v-html', () => {
  it('ChapterTextRenderer assainit le contenu texte', () => {
    const wrapper = mount(ChapterTextRenderer, {
      props: {
        chapter: {
          content_type: 'text',
          content: dangerousLessonHtml,
        },
      },
    })

    expectSafeLessonHtml(wrapper.find('.rendered-html').html())
  })

  it('ChapterTextRenderer assainit le contenu Word', () => {
    const wrapper = mount(ChapterTextRenderer, {
      props: {
        chapter: {
          content_type: 'word',
          content: dangerousLessonHtml,
        },
      },
    })

    expectSafeLessonHtml(wrapper.find('.word-document').html())
  })

  it('ChapterViewMode assainit le contenu Word', () => {
    const wrapper = mount(ChapterViewMode, {
      props: {
        chapter: {
          id: 1,
          title: 'Chapitre',
          content_type: 'word',
          content: dangerousLessonHtml,
        },
      },
    })

    expectSafeLessonHtml(wrapper.find('.chapter-word-content').html())
  })

  it('LessonRichTextEditor assainit la prévisualisation', async () => {
    const wrapper = mount(LessonRichTextEditor, {
      props: { modelValue: dangerousLessonHtml },
    })

    await wrapper.findAll('.tab-btn')[1].trigger('click')

    expectSafeLessonHtml(wrapper.find('.preview-content').html())
  })
})
