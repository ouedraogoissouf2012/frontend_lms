/** Test de rendu SettingsPasswordModal (#H3 ≤300) : rendu du formulaire (modale ouverte) + émission `submit`. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SettingsPasswordModal from '@/components/admin/SettingsPasswordModal.vue'

const mountModal = (props = {}) =>
  mount(SettingsPasswordModal, {
    props: {
      show: true,
      form: { currentPassword: '', newPassword: '', confirmPassword: '' },
      ...props,
    },
  })

describe('SettingsPasswordModal (#H3)', () => {
  it('rend les trois champs de mot de passe quand la modale est ouverte', () => {
    const w = mountModal()
    expect(w.findAll('input[type="password"]')).toHaveLength(3)
    expect(w.html()).toContain('Changer le mot de passe')
  })

  it('émet `submit` au clic sur Confirmer', async () => {
    const w = mountModal()
    const confirmBtn = w.findAll('button').find((b) => b.text() === 'Confirmer')
    await confirmBtn.trigger('click')
    expect(w.emitted('submit')).toBeTruthy()
  })

  it('met à jour l\'objet form partagé via v-model', async () => {
    const form = { currentPassword: '', newPassword: '', confirmPassword: '' }
    const w = mountModal({ form })
    await w.findAll('input[type="password"]')[0].setValue('secret')
    expect(form.currentPassword).toBe('secret')
  })
})
