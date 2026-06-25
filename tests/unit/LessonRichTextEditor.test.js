/** Test LessonRichTextEditor (#H4 ≤300) : bascule éditer/prévisualiser + v-model. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonRichTextEditor from '@/components/lessons/LessonRichTextEditor.vue'

describe('LessonRichTextEditor (#H4)', () => {
  it('édite par défaut puis bascule en prévisualisation', async () => {
    const w = mount(LessonRichTextEditor, { props: { modelValue: '<p>Bonjour</p>' } })
    const tabs = w.findAll('.tab-btn')
    expect(tabs[0].classes()).toContain('active')
    await tabs[1].trigger('click')
    expect(tabs[1].classes()).toContain('active')
    expect(w.find('.preview-content').html()).toContain('Bonjour')
  })

  it('affiche un état vide en prévisualisation sans contenu', async () => {
    const w = mount(LessonRichTextEditor, { props: { modelValue: '' } })
    await w.findAll('.tab-btn')[1].trigger('click')
    expect(w.find('.preview-empty').exists()).toBe(true)
  })

  it('émet update:modelValue à la saisie', async () => {
    const w = mount(LessonRichTextEditor, { props: { modelValue: '' } })
    await w.find('textarea').setValue('<h1>X</h1>')
    expect(w.emitted('update:modelValue')[0]).toEqual(['<h1>X</h1>'])
  })
})
