/** Test LessonBasicInfoFields (#H4 ≤300) : options matières/classes, v-model, load-chapters. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonBasicInfoFields from '@/components/lessons/LessonBasicInfoFields.vue'

const base = {
  title: '', description: '', type: 'cours', durationMinutes: null,
  matiereId: null, classeId: null, chapterId: null,
  matieres: [{ id: 1, nom: 'Maths' }], classes: [{ id: 2, name: '6e A' }], chapters: []
}

describe('LessonBasicInfoFields (#H4)', () => {
  it('rend les options matières et classes', () => {
    const w = mount(LessonBasicInfoFields, { props: base })
    expect(w.html()).toContain('Maths')
    expect(w.html()).toContain('6e A')
  })

  it('émet update:title à la saisie', async () => {
    const w = mount(LessonBasicInfoFields, { props: base })
    await w.find('input[type="text"]').setValue('Intro')
    expect(w.emitted('update:title')[0]).toEqual(['Intro'])
  })

  it('émet load-chapters au changement de matière', async () => {
    const w = mount(LessonBasicInfoFields, { props: base })
    const matiereSelect = w.findAll('select')[1]
    await matiereSelect.setValue(1)
    expect(w.emitted('load-chapters')).toBeTruthy()
    expect(w.emitted('update:matiereId')).toBeTruthy()
  })
})
