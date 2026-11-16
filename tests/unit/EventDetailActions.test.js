/**
 * Test de EventDetailActions (H8 ≤300) : visibilité des boutons selon le rôle/capacités
 * et émission de `action` avec le bon type.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EventDetailActions from '@/components/calendar/EventDetailActions.vue'

function mountActions(props = {}) {
  return mount(EventDetailActions, {
    props: { userRole: 'student', isSeance: true, eventData: {}, ...props }
  })
}

describe('EventDetailActions (H8)', () => {
  it('affiche toujours "Voir détails complets" et émet viewDetails', async () => {
    const w = mountActions()
    await w.find('.action-btn.outline').trigger('click')
    expect(w.emitted('action')[0]).toEqual(['viewDetails'])
  })

  it('étudiant: bouton rejoindre visio si canJoinVisio', async () => {
    const w = mountActions({ canJoinVisio: true })
    const join = w.find('.action-btn.primary')
    expect(join.exists()).toBe(true)
    await join.trigger('click')
    expect(w.emitted('action')[0]).toEqual(['joinVisio'])
  })

  it('étudiant: message d’attente si visio programmée et pas de jointure', () => {
    const w = mountActions({ canJoinVisio: false, eventData: { visio: { status: 'programmee' } } })
    expect(w.find('.waiting-message').exists()).toBe(true)
  })

  it('enseignant: 7 boutons (capacités max), dont « Rejoindre » (#582) et outline', () => {
    const w = mountActions({
      userRole: 'teacher',
      canActivateVisio: true, canStartVisio: true, canEndVisio: true
    })
    // rejoindre (#582) + activer + démarrer + terminer + participants + exporter + outline = 7
    expect(w.findAll('.action-btn')).toHaveLength(7)
  })

  it('admin: bascule libellé visio selon enabled + supprimer', async () => {
    const w = mountActions({ userRole: 'admin', eventData: { visio: { enabled: true } } })
    expect(w.text()).toContain('Désactiver')
    await w.find('.action-btn.danger').trigger('click')
    expect(w.emitted('action')[0]).toEqual(['delete'])
  })
})
