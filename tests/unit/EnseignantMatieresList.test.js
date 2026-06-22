/**
 * Test de RENDU de EnseignantMatieresList (#G1 décompo — extrait d'EnseignantDetailModal).
 * Vérifie le rendu des cartes matières, le bloc de stats conditionnel (heures_prevues),
 * les tags de classes, et la gestion de la section vide ("Aucune matière assignée").
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EnseignantMatieresList from '@/components/admin/EnseignantMatieresList.vue'

describe('EnseignantMatieresList (#G1) — rendu', () => {
  it('affiche "Aucune matière assignée" quand la liste est vide', () => {
    const w = mount(EnseignantMatieresList, { props: { matieres: [] } })
    expect(w.find('.no-data').text()).toBe('Aucune matière assignée')
    expect(w.find('.matieres-detail-list').exists()).toBe(false)
  })

  it('utilise les valeurs par défaut (props omises) sans planter', () => {
    const w = mount(EnseignantMatieresList)
    expect(w.find('.no-data').exists()).toBe(true)
  })

  it('rend une carte par matière avec code et fallback de nom', () => {
    const matieres = [
      { id: 1, nom: 'Algo', code: 'INF101' },
      { id: 2 },
    ]
    const w = mount(EnseignantMatieresList, { props: { matieres } })
    expect(w.findAll('.matiere-detail-card')).toHaveLength(2)
    expect(w.html()).toContain('INF101')
    expect(w.findAll('.matiere-detail-name')[1].text()).toBe('Matière sans nom')
  })

  it('affiche les stats de matière avec formats d\'origine quand heures_prevues présent', () => {
    const matieres = [{
      id: 1,
      nom: 'Algo',
      heures_prevues: 30,
      heures_effectuees: 18,
      taux_realisation: 59.7,
      nb_seances_effectuees: 6,
      nb_seances_total: 10,
    }]
    const w = mount(EnseignantMatieresList, { props: { matieres } })
    expect(w.find('.matiere-detail-stats').exists()).toBe(true)
    const html = w.html()
    expect(html).toContain('18h / 30h')
    expect(html).toContain('60%')
    expect(html).toContain('6/10')
  })

  it('masque le bloc de stats quand heures_prevues absent', () => {
    const w = mount(EnseignantMatieresList, { props: { matieres: [{ id: 1, nom: 'Algo' }] } })
    expect(w.find('.matiere-detail-stats').exists()).toBe(false)
  })

  it('rend les tags de classes de la matière', () => {
    const matieres = [{
      id: 1,
      nom: 'Algo',
      classes: [{ id: 1, nom: 'L1' }, { id: 2, nom: 'L2' }],
    }]
    const w = mount(EnseignantMatieresList, { props: { matieres } })
    expect(w.findAll('.matiere-classe-tag')).toHaveLength(2)
    expect(w.find('.matiere-classes').text()).toContain('L1')
  })
})
