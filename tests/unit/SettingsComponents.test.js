/** Tests de rendu/interaction des composants de paramètres enseignant (#H11 ≤300). */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SettingsPersonalInfo from '@/components/teacher/SettingsPersonalInfo.vue'
import SettingsNotifications from '@/components/teacher/SettingsNotifications.vue'
import PasswordChangeModal from '@/components/teacher/PasswordChangeModal.vue'

// Modal passe-plat : rend le contenu + le footer pour pouvoir cliquer dessus.
const ModalStub = {
  props: ['modelValue', 'title'],
  template: '<div><slot /><slot name="footer" /></div>',
}

describe('SettingsPersonalInfo (#H11)', () => {
  it('affiche nom complet, email et libellé de rôle', () => {
    const w = mount(SettingsPersonalInfo, {
      props: { user: { nom: 'Dupont', prenom: 'Marie', email: 'm@e.com' }, roleLabel: 'Enseignant' },
    })
    expect(w.findAll('.info-item')).toHaveLength(4)
    expect(w.text()).toContain('Dupont')
    expect(w.text()).toContain('m@e.com')
    expect(w.text()).toContain('Enseignant')
  })
})

describe('SettingsNotifications (#H11)', () => {
  it('émet save et met à jour le v-model au changement', async () => {
    const w = mount(SettingsNotifications, {
      props: { emailNotifications: true, seanceReminders: true },
    })
    const first = w.findAll('input[type="checkbox"]')[0]
    await first.setValue(false)
    expect(w.emitted('update:emailNotifications')[0]).toEqual([false])
    expect(w.emitted('save')).toBeTruthy()
  })
})

describe('PasswordChangeModal (#H11)', () => {
  it('émet submit depuis le bouton Confirmer', async () => {
    const w = mount(PasswordChangeModal, {
      props: { modelValue: true },
      global: { stubs: { Modal: ModalStub } },
    })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('submit')).toBeTruthy()
  })

  it('propage la saisie des champs via v-model', async () => {
    const w = mount(PasswordChangeModal, {
      props: { modelValue: true },
      global: { stubs: { Modal: ModalStub } },
    })
    const inputs = w.findAll('.form-input')
    await inputs[1].setValue('secret1')
    expect(w.emitted('update:newPassword')[0]).toEqual(['secret1'])
  })
})
