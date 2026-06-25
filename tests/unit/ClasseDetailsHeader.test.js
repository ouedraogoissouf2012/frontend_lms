/**
 * Test de rendu de ClasseDetailsHeader (#H9). Affiche titre + stats et emet back.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClasseDetailsHeader from '@/components/classes/ClasseDetailsHeader.vue'

describe('ClasseDetailsHeader (#H9)', () => {
  it('affiche le nom de la classe et les compteurs', () => {
    const w = mount(ClasseDetailsHeader, {
      props: { classe: { nom: '6e A' }, loading: false, etudiantsCount: 20, matieresCount: 8, evaluationsCount: 3 }
    })
    expect(w.find('.page-title').text()).toBe('6e A')
    const vals = w.findAll('.stat-value-header').map(v => v.text())
    expect(vals).toEqual(['20', '8', '3'])
  })

  it('masque les stats pendant le chargement', () => {
    const w = mount(ClasseDetailsHeader, { props: { classe: null, loading: true } })
    expect(w.find('.stats-grid-header').exists()).toBe(false)
  })

  it('emet back au clic sur Retour', async () => {
    const w = mount(ClasseDetailsHeader, { props: { classe: { nom: 'X' }, loading: false } })
    await w.find('.btn-retour').trigger('click')
    expect(w.emitted('back')).toBeTruthy()
  })
})
