/**
 * Test de RENDU du sous-composant SeancesFilters (#G1 ≤300).
 * Vérifie le montage, les 5 selects (le type : #675), l'affichage des options enseignants/classes,
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
  it('monte sans erreur et affiche 5 selects', () => {
    const w = mountFilters()
    expect(w.find('.filters-card').exists()).toBe(true)
    expect(w.findAll('select')).toHaveLength(5)
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
    // Le statut est désigné par sa valeur d'option, pas par sa place : #675 a inséré le type avant lui.
    const statusSelect = w.findAll('select').find((s) => s.find('option[value="active"]').exists())
    await statusSelect.setValue('active')
    expect(w.emitted('update:status')[0]).toEqual(['active'])
  })
})
