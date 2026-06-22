/**
 * Test de RENDU du sous-composant ClassesFilters (#G1 ≤300).
 * Vérifie le montage, le rendu des options filière/niveau, l'émission apply au
 * changement, l'émission reset, et la mise à jour des v-model.
 * NB : ArrowPathIcon est volontairement non résolu (parité avec l'original) → stubé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClassesFilters from '@/components/admin/ClassesFilters.vue'

function mountFilters(props = {}) {
  return mount(ClassesFilters, {
    props: {
      filieres: [{ id: 11, nom: 'Sciences' }],
      niveaux: [{ id: 21, nom: 'Niv 1' }],
      filiereId: '',
      niveauId: '',
      statut: '',
      ...props
    },
    global: { stubs: { ArrowPathIcon: true } }
  })
}

describe('ClassesFilters (#G1) — rendu', () => {
  it('monte et affiche les 3 selects + les options dynamiques', () => {
    const w = mountFilters()
    expect(w.find('.filters-card').exists()).toBe(true)
    expect(w.findAll('select')).toHaveLength(3)
    expect(w.html()).toContain('Sciences')
    expect(w.html()).toContain('Niv 1')
  })

  it('le bouton réinitialiser est masqué sans filtre actif', () => {
    const w = mountFilters()
    expect(w.find('.btn-reset').exists()).toBe(false)
  })

  it('met à jour le v-model et émet apply au changement de filière', async () => {
    const w = mountFilters()
    const [filiereSelect] = w.findAll('select')
    await filiereSelect.setValue('11')
    expect(w.emitted('update:filiereId')[0]).toEqual([11])
    expect(w.emitted('apply')).toBeTruthy()
  })

  it('affiche puis émet reset au clic sur Réinitialiser', async () => {
    const w = mountFilters({ statut: 'active' })
    const btn = w.find('.btn-reset')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })
})
