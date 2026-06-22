/**
 * Test de RENDU de MatiereModals (#G1 décompo — extrait d'AdminMatieres).
 * Deux modales détail : Niveau (table des matières) et Matière (détails), pilotées
 * par les props niveau/matiere. Vérifie rendu conditionnel, contenu, et les events
 * close-niveau / close-matiere / view-matiere. Teleport stubbé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MatiereModals from '@/components/admin/MatiereModals.vue'

const matiere = {
  id: 1, nom: 'Mathématiques', code: 'MATH', coefficient: 4,
  heures_total: 30, nb_seances_programmees: 5, couleur: '#ff0000',
  description: 'Cours de maths', combinaisons: [],
}
const niveau = {
  niveau: { nom: 'Sixième', code: '6E' },
  matieres: [matiere],
  totalHeures: 30, totalSeances: 5,
}

const mountModals = (props = {}) =>
  mount(MatiereModals, { props, global: { stubs: { teleport: true } } })

describe('MatiereModals (#G1) — rendu', () => {
  it('ne rend aucune modale sans props', () => {
    const w = mountModals()
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('modale Niveau : titre + table des matières', () => {
    const w = mountModals({ niveau })
    expect(w.html()).toContain('Sixième')
    expect(w.find('.matieres-table').exists()).toBe(true)
    expect(w.html()).toContain('Mathématiques')
  })

  it('émet view-matiere avec la matière au clic sur l\'action', async () => {
    const w = mountModals({ niveau })
    await w.find('.matieres-table .action-btn').trigger('click')
    expect(w.emitted('view-matiere')[0][0]).toMatchObject({ code: 'MATH' })
  })

  it('modale Matière : détails affichés + close-matiere', async () => {
    const w = mountModals({ matiere })
    expect(w.find('.detail-grid').exists()).toBe(true)
    expect(w.html()).toContain('Cours de maths')
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close-matiere')).toBeTruthy()
  })

  it('émet close-niveau au clic sur l\'overlay de la modale Niveau', async () => {
    const w = mountModals({ niveau })
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close-niveau')).toBeTruthy()
  })
})
