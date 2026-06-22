/**
 * Test de RENDU de EnseignantDetailModal (#G1 décompo — extrait d'AdminEnseignants).
 * Rendu conditionné par `enseignant`, en-tête (nom/prénom/email), champs présents,
 * sections vides gérées, et émission de `close`. Teleport stubbé pour assertions inline.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EnseignantDetailModal from '@/components/admin/EnseignantDetailModal.vue'

const baseEnseignant = {
  nom: 'Bede',
  prenom: 'Test',
  email: 'bede@example.com',
  matricule: 'E-1',
  matieres: [],
}

function mountModal(props = {}) {
  return mount(EnseignantDetailModal, {
    props: { enseignant: baseEnseignant, ...props },
    global: { stubs: { teleport: true } },
  })
}

describe('EnseignantDetailModal (#G1) — rendu', () => {
  it('ne rend pas l\'overlay quand enseignant est null', () => {
    const w = mountModal({ enseignant: null })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('affiche nom/prénom, email et champs présents', () => {
    const w = mountModal()
    expect(w.find('.modal-title').text()).toBe('Bede Test')
    expect(w.find('.modal-subtitle').text()).toBe('bede@example.com')
    expect(w.html()).toContain('E-1')
  })

  it('gère les sections vides (aucune classe / matière assignée)', () => {
    const w = mountModal()
    expect(w.html()).toContain('Aucune classe assignée')
    expect(w.html()).toContain('Aucune matière assignée')
  })

  it('émet close au clic sur Fermer, la croix et l\'overlay', async () => {
    const w = mountModal()
    await w.find('.modal-btn-secondary').trigger('click')
    await w.find('.close-btn').trigger('click')
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toHaveLength(3)
  })
})
