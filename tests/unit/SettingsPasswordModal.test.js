/**
 * Test de rendu de la modale de mot de passe admin (#H3 ≤300).
 * La fonctionnalité n'existe pas côté backend : la modale reste affichée mais
 * en lecture seule (champs + bouton désactivés) avec un message d'explication.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SettingsPasswordModal from '@/components/admin/SettingsPasswordModal.vue'
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'

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

  it('explique que le changement de mot de passe est indisponible', () => {
    const w = mountModal()
    expect(w.text()).toContain(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
  })

  it('désactive les champs et le bouton Confirmer', () => {
    const w = mountModal()
    w.findAll('input[type="password"]').forEach((i) => {
      expect(i.attributes('disabled')).toBeDefined()
    })
    const confirmBtn = w.findAll('button').find((b) => b.text() === 'Confirmer')
    expect(confirmBtn.attributes('disabled')).toBeDefined()
  })

  it('n\'émet pas `submit` au clic sur le bouton désactivé', async () => {
    const w = mountModal()
    const confirmBtn = w.findAll('button').find((b) => b.text() === 'Confirmer')
    await confirmBtn.trigger('click')
    expect(w.emitted('submit')).toBeFalsy()
  })
})
