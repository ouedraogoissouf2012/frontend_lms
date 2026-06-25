/**
 * Test de SettingsNotifications (#H10) : les bascules pilotent les v-model et
 * émettent `change` pour déclencher la persistance côté parent.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SettingsNotifications from '@/components/student/SettingsNotifications.vue'

function mountNotif(props = {}) {
  return mount(SettingsNotifications, {
    props: { emailNotifications: true, visioReminders: true, ...props },
    global: { stubs: { BellIcon: true } },
  })
}

describe('SettingsNotifications (#H10)', () => {
  it('rend les deux préférences', () => {
    const w = mountNotif()
    expect(w.findAll('input[type="checkbox"]')).toHaveLength(2)
    expect(w.text()).toContain('Notifications par email')
    expect(w.text()).toContain('Rappels de visioconférences')
  })

  it('bascule email : émet update:emailNotifications + change', async () => {
    const w = mountNotif()
    await w.findAll('input[type="checkbox"]')[0].setValue(false)
    expect(w.emitted('update:emailNotifications').at(-1)).toEqual([false])
    expect(w.emitted('change')).toBeTruthy()
  })

  it('bascule visio : émet update:visioReminders + change', async () => {
    const w = mountNotif()
    await w.findAll('input[type="checkbox"]')[1].setValue(false)
    expect(w.emitted('update:visioReminders').at(-1)).toEqual([false])
    expect(w.emitted('change')).toBeTruthy()
  })
})
