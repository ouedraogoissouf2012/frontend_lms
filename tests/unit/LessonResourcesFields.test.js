/** Test LessonResourcesFields (#H4 ≤300) : état vide, liste, emits add/remove. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LessonResourcesFields from '@/components/lessons/LessonResourcesFields.vue'

describe('LessonResourcesFields (#H4)', () => {
  it('affiche l\'état vide sans ressource', () => {
    const w = mount(LessonResourcesFields, { props: { resources: [] } })
    expect(w.find('.resources-empty').exists()).toBe(true)
    expect(w.find('.resource-card').exists()).toBe(false)
  })

  it('rend une carte par ressource', () => {
    const w = mount(LessonResourcesFields, {
      props: { resources: [{ title: 'A', type: 'pdf', url: '', description: '' }] }
    })
    expect(w.findAll('.resource-card')).toHaveLength(1)
  })

  it('émet add et remove', async () => {
    const w = mount(LessonResourcesFields, {
      props: { resources: [{ title: 'A', type: 'pdf', url: '', description: '' }] }
    })
    await w.find('.btn-add').trigger('click')
    expect(w.emitted('add')).toHaveLength(1)
    await w.find('.btn-remove').trigger('click')
    expect(w.emitted('remove')[0]).toEqual([0])
  })
})
