/**
 * Test de RENDU du sous-composant SeancesFilters (#G1 ≤300).
 * Vérifie le montage, les 4 selects, l'affichage des options enseignants/classes,
 * la mise à jour des v-model et l'émission de `change`.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeancesFilters from '@/components/admin/SeancesFilters.vue'

function mountFilters(props = {}) {
  return mount(SeancesFilters, {
    props: {
      days: '30',
      teacherId: '',
      classeId: '',
      status: '',
      teachers: [{ id: 10, nom: 'Zoé', prenom: 'P' }],
      classes: [{ id: 5, name: '6e A' }],
      ...props,
    },
  })
}

describe('SeancesFilters (#G1) — rendu', () => {
  it('monte sans erreur et affiche 4 selects', () => {
    const w = mountFilters()
    expect(w.find('.filters-card').exists()).toBe(true)
    expect(w.findAll('select')).toHaveLength(4)
  })

  it('affiche les options enseignants et classes fournies', () => {
    const w = mountFilters()
    expect(w.html()).toContain('Zoé')
    expect(w.html()).toContain('6e A')
  })

  it('met à jour le v-model days et émet change au changement de période', async () => {
    const w = mountFilters()
    const [periodSelect] = w.findAll('select')
    await periodSelect.setValue('7')
    expect(w.emitted('update:days')[0]).toEqual(['7'])
    expect(w.emitted('change')).toBeTruthy()
  })

  it('met à jour le v-model du statut', async () => {
    const w = mountFilters()
    const statusSelect = w.findAll('select')[3]
    await statusSelect.setValue('active')
    expect(w.emitted('update:status')[0]).toEqual(['active'])
  })
})
