/**
 * Test de rendu de ClasseMatieresTab (#H9). Affiche la table et emet
 * view-matiere au clic sur Voir details.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClasseMatieresTab from '@/components/classes/ClasseMatieresTab.vue'

describe('ClasseMatieresTab (#H9)', () => {
  it('affiche un message quand vide', () => {
    const w = mount(ClasseMatieresTab, { props: { matieres: [] } })
    expect(w.text()).toContain('Aucune matière disponible')
  })

  it('rend une ligne par matiere et emet view-matiere', async () => {
    const w = mount(ClasseMatieresTab, { props: { matieres: [{ id: 3, nom: 'Maths', code: 'MAT', coefficient: 2 }] } })
    expect(w.find('table').exists()).toBe(true)
    expect(w.text()).toContain('Maths')
    await w.find('button').trigger('click')
    expect(w.emitted('view-matiere')[0]).toEqual([3])
  })
})
