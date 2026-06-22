/**
 * Test de RENDU de EnseignantClassesList (#G1 décompo — extrait d'EnseignantDetailModal).
 * Vérifie le rendu des cartes classes, les badges filière/niveau, le fallback de nom,
 * et la gestion de la section vide ("Aucune classe assignée").
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EnseignantClassesList from '@/components/admin/EnseignantClassesList.vue'

describe('EnseignantClassesList (#G1) — rendu', () => {
  it('affiche "Aucune classe assignée" quand la liste est vide', () => {
    const w = mount(EnseignantClassesList, { props: { classes: [] } })
    expect(w.find('.no-data').text()).toBe('Aucune classe assignée')
    expect(w.find('.classes-detail-list').exists()).toBe(false)
  })

  it('utilise les valeurs par défaut (props omises) sans planter', () => {
    const w = mount(EnseignantClassesList)
    expect(w.find('.no-data').exists()).toBe(true)
  })

  it('rend une carte par classe avec badges filière/niveau', () => {
    const classes = [
      { id: 1, nom: 'L1 Info', filiere: 'Informatique', niveau: 'L1' },
      { id: 2, nom: 'L2 Math', filiere: 'Maths' },
    ]
    const w = mount(EnseignantClassesList, { props: { classes } })
    expect(w.findAll('.classe-detail-card')).toHaveLength(2)
    expect(w.html()).toContain('L1 Info')
    expect(w.findAll('.badge-filiere')).toHaveLength(2)
    expect(w.findAll('.badge-niveau')).toHaveLength(1)
  })

  it('affiche le fallback de nom de classe', () => {
    const w = mount(EnseignantClassesList, { props: { classes: [{ id: 3 }] } })
    expect(w.find('.classe-detail-name').text()).toBe('Classe sans nom')
  })
})
