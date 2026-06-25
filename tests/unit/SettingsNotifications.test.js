/** Test de rendu SettingsNotifications (#H3 ≤300) : v-model des deux interrupteurs + émission `save`. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SettingsNotifications from '@/components/admin/SettingsNotifications.vue'

const mountNotif = (props = {}) =>
  mount(SettingsNotifications, {
    props: { emailNotifications: true, systemAlerts: true, ...props },
  })

describe('SettingsNotifications (#H3)', () => {
  it('rend deux interrupteurs reflétant les v-model', () => {
    const w = mountNotif({ emailNotifications: true, systemAlerts: false })
    const inputs = w.findAll('input[type="checkbox"]')
    expect(inputs).toHaveLength(2)
    expect(inputs[0].element.checked).toBe(true)
    expect(inputs[1].element.checked).toBe(false)
  })

  it('met à jour le v-model et émet `save` au changement', async () => {
    const w = mountNotif({ emailNotifications: true, systemAlerts: true })
    await w.findAll('input[type="checkbox"]')[0].setValue(false)
    expect(w.emitted('update:emailNotifications')[0]).toEqual([false])
    expect(w.emitted('save')).toBeTruthy()
  })
})
