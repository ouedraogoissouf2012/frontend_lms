/**
 * Test de SettingsPasswordModal étudiant (#H10) : la fonctionnalité n'existe pas
 * côté backend (aucun endpoint) — la modale doit l'annoncer, désactiver la
 * saisie et ne JAMAIS afficher de succès. Modal stubbé, toast mocké.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))
vi.mock('@/services/toast', () => ({
  toast: {
    success: (...a) => h.success(...a),
    error: (...a) => h.error(...a),
    info: (...a) => h.info(...a),
  },
}))

import SettingsPasswordModal from '@/components/student/SettingsPasswordModal.vue'
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'

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

describe('SettingsPasswordModal étudiant (#H10)', () => {
  beforeEach(() => { h.success.mockReset(); h.error.mockReset(); h.info.mockReset() })

  it('affiche l\'indisponibilité du changement de mot de passe', () => {
    const w = mountModal()
    expect(w.text()).toContain(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
  })

  it('désactive les trois champs et le bouton de confirmation', () => {
    const w = mountModal()
    const inputs = w.findAll('input[type="password"]')
    expect(inputs).toHaveLength(3)
    inputs.forEach((i) => expect(i.attributes('disabled')).toBeDefined())
    expect(w.find('button.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('n\'affiche jamais de succès, même si la soumission est forcée', async () => {
    const w = mountModal()
    await w.find('form').trigger('submit')
    expect(h.success).not.toHaveBeenCalled()
    expect(h.info).toHaveBeenCalledWith(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
  })

  it('le bouton Fermer ferme la modale', async () => {
    const w = mountModal()
    await w.find('button.btn-cancel').trigger('click')
    expect(w.emitted('update:modelValue').at(-1)).toEqual([false])
  })
})
