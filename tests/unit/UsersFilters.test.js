/**
 * Test de rendu UsersFilters (#G1 ≤300) : v-model recherche/rôle/classe + options.
 *
 * La fixture de classe reproduit la forme RÉELLE de `/proxy/classes`
 * (`{id, name, libelle:null}`). L'ancienne inventait un champ `nom` : le test
 * passait au vert pendant que l'écran affichait 17 options aux libellés vides.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UsersFilters from '@/components/admin/UsersFilters.vue'

const REAL_CLASSE = { id: 1, name: 'B2 COM', libelle: null }

const mountFilters = (props = {}) =>
  mount(UsersFilters, {
    props: { search: '', role: 'all', classe: 'all', classes: [REAL_CLASSE], ...props },
  })

describe('UsersFilters (#G1)', () => {
  it('rend le libellé réel des classes (champ `name`, pas `nom`)', () => {
    const w = mountFilters()
    const options = w.findAll('select')[1].findAll('option').map(o => o.text())
    expect(options).toEqual(['Toutes les classes', 'B2 COM'])
    expect(w.findAll('select')).toHaveLength(2)
  })

  it('n’affiche jamais une option vide, même sans libellé exploitable', () => {
    const w = mountFilters({ classes: [{ id: 7 }] })
    const options = w.findAll('select')[1].findAll('option').map(o => o.text())
    // Une ligne blanche est inutilisable : l'entrée reste sélectionnable.
    expect(options).toEqual(['Toutes les classes', 'Classe 7'])
  })

  it('met à jour les v-model search et role', async () => {
    const w = mountFilters()
    await w.find('.search-input').setValue('marcel')
    expect(w.emitted('update:search')[0]).toEqual(['marcel'])
    await w.findAll('select')[0].setValue('etudiant')
    expect(w.emitted('update:role')[0]).toEqual(['etudiant'])
  })

  it('émet l’identifiant de classe sélectionné', async () => {
    const w = mountFilters()
    const classeSelect = w.findAll('select')[1]
    await classeSelect.setValue(1)
    expect(w.emitted('update:classe')[0]).toEqual([1])
  })
})
