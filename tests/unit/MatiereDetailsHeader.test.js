/**
 * Test de rendu de MatiereDetailsHeader (#H9). Titre, badges, stats et back.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MatiereDetailsHeader from '@/components/matieres/MatiereDetailsHeader.vue'

describe('MatiereDetailsHeader (#H9)', () => {
  it('affiche le nom de la matiere et les badges', () => {
    const w = mount(MatiereDetailsHeader, {
      props: { matiere: { nom: 'Maths', code: 'MAT', coefficient: 2 }, statistiques: null }
    })
    expect(w.find('.page-title').text()).toBe('Maths')
    expect(w.text()).toContain('Code: MAT')
    expect(w.text()).toContain('Coeff: 2')
  })

  it('affiche Chargement quand pas de matiere et masque les stats', () => {
    const w = mount(MatiereDetailsHeader, { props: { matiere: null, statistiques: null } })
    expect(w.find('.page-title').text()).toBe('Chargement...')
    expect(w.find('.compact-stats').exists()).toBe(false)
  })

  it('emet back au clic sur le breadcrumb', async () => {
    const w = mount(MatiereDetailsHeader, { props: { matiere: { nom: 'X' }, statistiques: null } })
    await w.find('.breadcrumb-link').trigger('click')
    expect(w.emitted('back')).toBeTruthy()
  })
})
