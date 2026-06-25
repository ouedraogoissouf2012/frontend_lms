/**
 * Test de SettingsPasswordModal (#H10) : validations + succès simulé (dette
 * pré-existante CONSERVÉE : aucun appel API). Modal stubbé, toast mocké.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/services/toast', () => ({ toast: { success: (...a) => h.success(...a), error: (...a) => h.error(...a) } }))

import SettingsPasswordModal from '@/components/student/SettingsPasswordModal.vue'

const ModalStub = {
  name: 'Modal',
  props: ['modelValue', 'title'],
  template: '<div class="modal-stub"><slot /><slot name="footer" /></div>',
}

function mountModal() {
  return mount(SettingsPasswordModal, {
    props: { modelValue: true },
    global: { stubs: { Modal: ModalStub } },
  })
}

function fill(w, current, next, confirm) {
  const inputs = w.findAll('input[type="password"]')
  return Promise.all([
    inputs[0].setValue(current),
    inputs[1].setValue(next),
    inputs[2].setValue(confirm),
  ])
}

describe('SettingsPasswordModal (#H10)', () => {
  beforeEach(() => { h.success.mockReset(); h.error.mockReset() })

  it('rejette des mots de passe différents', async () => {
    const w = mountModal()
    await fill(w, 'old', 'abcdef', 'zzzzzz')
    await w.find('button[type="submit"]').trigger('click')
    expect(h.error).toHaveBeenCalledWith('Les mots de passe ne correspondent pas')
    expect(h.success).not.toHaveBeenCalled()
  })

  it('rejette un mot de passe trop court', async () => {
    const w = mountModal()
    await fill(w, 'old', '123', '123')
    await w.find('button[type="submit"]').trigger('click')
    expect(h.error).toHaveBeenCalledWith('Le mot de passe doit contenir au moins 6 caractères')
  })

  it('simule le succès (dette : pas d\'appel API) et ferme la modale', async () => {
    const w = mountModal()
    await fill(w, 'old', 'abcdef', 'abcdef')
    await w.find('button[type="submit"]').trigger('click')
    expect(h.success).toHaveBeenCalledWith('Votre mot de passe a été changé avec succès')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('le bouton Annuler ferme la modale', async () => {
    const w = mountModal()
    await w.find('button.btn-cancel').trigger('click')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
  })
})
