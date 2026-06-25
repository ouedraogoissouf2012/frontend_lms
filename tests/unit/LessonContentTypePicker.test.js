/** Test LessonContentTypePicker (#H4 ≤300) : rendu des cartes, état actif, v-model. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonContentTypePicker from '@/components/lessons/LessonContentTypePicker.vue'

const contentTypes = [
  { value: 'text', label: 'Texte', icon: '[T]' },
  { value: 'video', label: 'Vidéo', icon: '[V]' }
]

describe('LessonContentTypePicker (#H4)', () => {
  it('rend une carte par type et marque l\'actif', () => {
    const w = mount(LessonContentTypePicker, { props: { modelValue: 'video', contentTypes } })
    expect(w.findAll('.content-type-card')).toHaveLength(2)
    expect(w.findAll('.content-type-card')[1].classes()).toContain('active')
  })

  it('émet update:modelValue à la sélection', async () => {
    const w = mount(LessonContentTypePicker, { props: { modelValue: 'text', contentTypes } })
    await w.findAll('input[type="radio"]')[1].setValue()
    expect(w.emitted('update:modelValue')[0]).toEqual(['video'])
  })
})
