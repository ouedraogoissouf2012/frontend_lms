/**
 * Test de RENDU du sous-composant MatieresFilters (#G1 ≤300).
 * Vérifie le montage, l'affichage des options filière/niveau, le bouton reset
 * conditionnel, l'émission de `reset` et la mise à jour des v-model.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MatieresFilters from '@/components/admin/MatieresFilters.vue'

function mountFilters(props = {}) {
  return mount(MatieresFilters, {
    props: {
      search: '',
      filiereId: '',
      niveauId: '',
      filieres: [{ id: 11, nom: 'Scientifique' }],
      niveaux: [{ id: 21, nom: '6e', code: '6E' }],
      ...props,
    },
  })
}

describe('MatieresFilters (#G1) — rendu', () => {
  it('monte sans erreur et affiche les options filière/niveau', () => {
    const w = mountFilters()
    expect(w.find('.filters-card').exists()).toBe(true)
    expect(w.html()).toContain('Scientifique')
    expect(w.html()).toContain('6e')
  })

  it('masque le bouton reset quand aucun filtre actif', () => {
    const w = mountFilters()
    expect(w.find('.btn-reset').exists()).toBe(false)
  })

  it('affiche le bouton reset et émet `reset` au clic', async () => {
    const w = mountFilters({ search: 'maths' })
    expect(w.find('.btn-reset').exists()).toBe(true)
    await w.find('.btn-reset').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('met à jour les v-model search / filière / niveau', async () => {
    const w = mountFilters()
    await w.find('.filter-input').setValue('chimie')
    expect(w.emitted('update:search')[0]).toEqual(['chimie'])
    const [filiereSelect, niveauSelect] = w.findAll('select')
    await filiereSelect.setValue('11')
    expect(w.emitted('update:filiereId')[0]).toEqual([11])
    await niveauSelect.setValue('21')
    expect(w.emitted('update:niveauId')[0]).toEqual([21])
  })
})
