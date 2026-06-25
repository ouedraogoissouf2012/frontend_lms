/**
 * Test de rendu de MatiereLessonsTab (#H9). Bascule grille/liste (v-model),
 * relai des actions et etat vide.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MatiereLessonsTab from '@/components/matieres/MatiereLessonsTab.vue'

const stubs = { LessonCard: { template: '<div class="lc" />', props: ['lesson'] } }

describe('MatiereLessonsTab (#H9)', () => {
  it('affiche etat vide quand pas de lecon (non chargement)', () => {
    const w = mount(MatiereLessonsTab, { props: { lessons: [], loading: false, viewMode: 'grid' }, global: { stubs } })
    expect(w.text()).toContain('Aucune leçon disponible')
  })

  it('rend les cartes en grille et emet create', async () => {
    const w = mount(MatiereLessonsTab, {
      props: { lessons: [{ id: 1 }, { id: 2 }], isTeacher: true, loading: false, viewMode: 'grid' },
      global: { stubs }
    })
    expect(w.findAll('.lc')).toHaveLength(2)
    expect(w.find('.lessons-grid').exists()).toBe(true)
    await w.findAll('button').find(b => b.text().includes('Nouvelle leçon')).trigger('click')
    expect(w.emitted('create')).toBeTruthy()
  })

  it('bascule en liste via v-model viewMode', async () => {
    const w = mount(MatiereLessonsTab, {
      props: { lessons: [{ id: 1 }], isTeacher: false, loading: false, viewMode: 'grid' },
      global: { stubs }
    })
    await w.findAll('.toggle-btn')[1].trigger('click')
    expect(w.emitted('update:viewMode')[0]).toEqual(['list'])
  })
})
