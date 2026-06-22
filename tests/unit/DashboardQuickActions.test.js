/**
 * Test de rendu DashboardQuickActions (#H3 ≤300) : 5 boutons d'action, émission de
 * 'navigate' (avec chemin) et 'generate-report'. QuickActionButton stubé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions.vue'

const QuickActionButtonStub = {
  props: ['label', 'icon', 'variant'],
  emits: ['click'],
  inheritAttrs: false,
  template: '<button class="qab" @click="$emit(\'click\')">{{ label }}</button>',
}

function mountIt() {
  return mount(DashboardQuickActions, {
    global: { stubs: { QuickActionButton: QuickActionButtonStub } },
  })
}

describe('DashboardQuickActions (#H3)', () => {
  it('rend les 5 boutons d\'action rapide', () => {
    const w = mountIt()
    expect(w.findAll('.qab')).toHaveLength(5)
    expect(w.text()).toContain('Gérer Séances & Visio')
    expect(w.text()).toContain('Générer Rapport')
  })

  it('émet navigate avec le bon chemin au clic', async () => {
    const w = mountIt()
    const buttons = w.findAll('.qab')
    await buttons[0].trigger('click') // Gérer Séances & Visio
    await buttons[3].trigger('click') // Voir Statistiques
    expect(w.emitted('navigate')).toEqual([
      ['/coordinateur/seances'],
      ['/admin/stats'],
    ])
  })

  it('émet generate-report sur le dernier bouton', async () => {
    const w = mountIt()
    await w.findAll('.qab')[4].trigger('click')
    expect(w.emitted('generate-report')).toHaveLength(1)
  })
})
