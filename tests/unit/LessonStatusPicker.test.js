/** Test LessonStatusPicker (#H4 ≤300) : 3 cartes statut, actif, v-model. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonStatusPicker from '@/components/lessons/LessonStatusPicker.vue'

describe('LessonStatusPicker (#H4)', () => {
  it('marque la carte correspondant au statut courant', () => {
    const w = mount(LessonStatusPicker, { props: { modelValue: 'published' } })
    const cards = w.findAll('.status-card')
    expect(cards).toHaveLength(3)
    expect(cards[1].classes()).toContain('active')
  })

  it('émet update:modelValue à la sélection', async () => {
    const w = mount(LessonStatusPicker, { props: { modelValue: 'draft' } })
    await w.findAll('input[type="radio"]')[2].setValue()
    expect(w.emitted('update:modelValue')[0]).toEqual(['archived'])
  })
})
