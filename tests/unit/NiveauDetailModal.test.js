/**
 * Test de RENDU de NiveauDetailModal (#G1 décompo). Modale table des matières d'un
 * niveau. Vérifie rendu conditionnel (prop niveau), contenu (titre, table, lignes)
 * et les events close / view-matiere. Teleport stubbé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import NiveauDetailModal from '@/components/admin/NiveauDetailModal.vue'

const matiere = {
  id: 1, nom: 'Mathématiques', code: 'MATH', coefficient: 4,
  heures_total: 30, nb_seances_programmees: 5, couleur: '#ff0000',
  description: 'Cours de maths',
}
const niveau = {
  niveau: { nom: 'Sixième', code: '6E' },
  matieres: [matiere],
  totalHeures: 30, totalSeances: 5,
}

const mountModal = (props = {}) =>
  mount(NiveauDetailModal, { props, global: { stubs: { teleport: true } } })

describe('NiveauDetailModal (#G1) — rendu', () => {
  it('ne rend rien sans prop niveau', () => {
    const w = mountModal()
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('rend titre, sous-titre et table des matières', () => {
    const w = mountModal({ niveau })
    expect(w.html()).toContain('Sixième')
    expect(w.html()).toContain('1 matière(s)')
    expect(w.find('.matieres-table').exists()).toBe(true)
    expect(w.html()).toContain('Mathématiques')
    expect(w.html()).toContain('MATH')
  })

  it('émet view-matiere avec la matière au clic sur l\'action', async () => {
    const w = mountModal({ niveau })
    await w.find('.matieres-table .action-btn').trigger('click')
    expect(w.emitted('view-matiere')[0][0]).toMatchObject({ code: 'MATH' })
  })

  it('émet close au clic sur l\'overlay', async () => {
    const w = mountModal({ niveau })
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('émet close au clic sur le bouton de fermeture', async () => {
    const w = mountModal({ niveau })
    await w.find('.modal-close-btn').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
