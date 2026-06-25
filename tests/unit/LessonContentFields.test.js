/** Test LessonContentFields (#H4 ≤300) : branche par type + délégation texte/mixte. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonContentFields from '@/components/lessons/LessonContentFields.vue'

const stubs = { LessonRichTextEditor: true }

describe('LessonContentFields (#H4)', () => {
  it('affiche le champ URL vidéo + plateformes pour le type video', () => {
    const w = mount(LessonContentFields, {
      props: { contentType: 'video', videoProviders: [{ value: 'youtube', label: 'YouTube', icon: '►' }] },
      global: { stubs }
    })
    expect(w.find('.form-input').exists()).toBe(true)
    expect(w.find('.radio-group').exists()).toBe(true)
  })

  it('affiche un seul champ URL (sans plateformes) pour le type pdf', () => {
    const w = mount(LessonContentFields, { props: { contentType: 'pdf' }, global: { stubs } })
    expect(w.find('.form-input').exists()).toBe(true)
    expect(w.find('.radio-group').exists()).toBe(false)
  })

  it('délègue à LessonRichTextEditor pour le type text', () => {
    const w = mount(LessonContentFields, { props: { contentType: 'text' }, global: { stubs } })
    expect(w.findComponent({ name: 'LessonRichTextEditor' }).exists()).toBe(true)
  })

  it('émet update:videoUrl à la saisie', async () => {
    const w = mount(LessonContentFields, { props: { contentType: 'video' }, global: { stubs } })
    await w.find('.form-input').setValue('https://x.test')
    expect(w.emitted('update:videoUrl')[0]).toEqual(['https://x.test'])
  })
})
