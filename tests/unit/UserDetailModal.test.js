/**
 * Test de RENDU de UserDetailModal (#G1 décompo — extrait d'AdminUsers).
 * Vérifie : rendu conditionné par `user`, champs affichés, libellé de rôle,
 * classes de badge, masquage des champs optionnels, et émission de `close`.
 * Teleport stubbé pour garder le contenu inline et assertable.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UserDetailModal from '@/components/admin/UserDetailModal.vue'

const baseUser = {
  name: 'Marcel Ouedraogo',
  role: 'etudiant',
  email: 'marcel@example.com',
  classe_nom: '6e A',
  matricule: 'M-123',
}

function mountModal(props = {}) {
  return mount(UserDetailModal, {
    props: { user: baseUser, ...props },
    global: { stubs: { teleport: true } },
  })
}

describe('UserDetailModal (#G1) — rendu', () => {
  it('ne rend pas l\'overlay quand user est null', () => {
    const w = mountModal({ user: null })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('affiche le nom, le libellé de rôle, le badge et les champs présents', () => {
    const w = mountModal()
    expect(w.find('.modal-title').text()).toBe('Marcel Ouedraogo')
    expect(w.find('.modal-subtitle').text()).toBe('Étudiant')
    expect(w.find('.role-badge').classes()).toContain('role-etudiant')
    expect(w.find('.modal-avatar').classes()).toContain('avatar-etudiant')
    expect(w.html()).toContain('marcel@example.com')
    expect(w.html()).toContain('M-123')
  })

  it('masque les champs optionnels absents et mappe les autres rôles', () => {
    const w = mountModal({ user: { name: 'X', role: 'admin' } })
    expect(w.find('.modal-subtitle').text()).toBe('Admin')
    expect(w.html()).not.toContain('Matricule')
    expect(w.html()).not.toContain('Classe:')
  })

  it('émet close au clic sur Fermer, la croix et l\'overlay', async () => {
    const w = mountModal()
    await w.find('.modal-btn-secondary').trigger('click')
    await w.find('.close-btn').trigger('click')
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toHaveLength(3)
  })
})
