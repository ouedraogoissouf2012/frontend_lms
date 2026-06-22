/**
 * Test de RENDU de MatiereDetailModal (#G1 décompo). Modale détails d'une matière.
 * Vérifie rendu conditionnel (prop matiere), contenu (grille de détails, description,
 * combinaisons) et l'event close. Teleport stubbé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MatiereDetailModal from '@/components/admin/MatiereDetailModal.vue'

const matiere = {
  id: 1, nom: 'Mathématiques', code: 'MATH', coefficient: 4,
  heures_total: 30, nb_seances_programmees: 5, couleur: '#ff0000',
  description: 'Cours de maths', combinaisons: [],
}

const mountModal = (props = {}) =>
  mount(MatiereDetailModal, { props, global: { stubs: { teleport: true } } })

describe('MatiereDetailModal (#G1) — rendu', () => {
  it('ne rend rien sans prop matiere', () => {
    const w = mountModal()
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('rend la grille de détails et la description', () => {
    const w = mountModal({ matiere })
    expect(w.find('.detail-grid').exists()).toBe(true)
    expect(w.html()).toContain('Mathématiques')
    expect(w.html()).toContain('MATH')
    expect(w.html()).toContain('Cours de maths')
  })

  it('rend les combinaisons quand présentes', () => {
    const m = {
      ...matiere,
      combinaisons: [
        { filiere: { nom: 'Scientifique' }, niveau: { nom: 'Terminale' } },
      ],
    }
    const w = mountModal({ matiere: m })
    expect(w.find('.combinaisons-list').exists()).toBe(true)
    expect(w.html()).toContain('Scientifique')
    expect(w.html()).toContain('Terminale')
  })

  it('n\'affiche pas la section combinaisons quand vide', () => {
    const w = mountModal({ matiere })
    expect(w.find('.combinaisons-list').exists()).toBe(false)
  })

  it('émet close au clic sur le bouton de fermeture', async () => {
    const w = mountModal({ matiere })
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('émet close au clic sur l\'overlay', async () => {
    const w = mountModal({ matiere })
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
