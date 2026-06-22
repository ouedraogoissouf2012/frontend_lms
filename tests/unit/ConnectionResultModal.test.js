/**
 * Test de RENDU de ConnectionResultModal (#G1 décompo — extrait d'InstitutionModals).
 * Modale résultat de test de connexion KLASSCI : affichage succès/échec et détails,
 * event close. Teleport stubbé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ConnectionResultModal from '@/components/admin/ConnectionResultModal.vue'

const mountModal = (props = {}) =>
  mount(ConnectionResultModal, {
    props,
    global: { stubs: { teleport: true } },
  })

describe('ConnectionResultModal (#G1)', () => {
  it('rien d\'affiché sans connectionResult', () => {
    expect(mountModal().find('.modal-overlay').exists()).toBe(false)
  })

  it('affiche un succès (icône + message + détails)', () => {
    const w = mountModal({
      connectionResult: {
        success: true,
        message: 'Connexion OK',
        data: { api_url: 'https://x.klassci.com', status_code: 200, response_time_ms: 42 },
      },
    })
    expect(w.html()).toContain('Test de Connexion')
    expect(w.find('.connection-status').classes()).toContain('connection-success')
    expect(w.find('.connection-icon').classes()).toContain('fa-check-circle')
    expect(w.text()).toContain('Connexion OK')
    expect(w.text()).toContain('https://x.klassci.com')
    expect(w.text()).toContain('200')
    expect(w.text()).toContain('42ms')
  })

  it('affiche un échec', () => {
    const w = mountModal({ connectionResult: { success: false, message: 'Échec' } })
    expect(w.find('.connection-status').classes()).toContain('connection-error')
    expect(w.find('.connection-icon').classes()).toContain('fa-times-circle')
    expect(w.text()).toContain('Échec')
  })

  it('émet close (overlay et bouton Fermer)', async () => {
    const w = mountModal({ connectionResult: { success: true, message: 'OK' } })
    await w.find('.modal-btn-secondary').trigger('click')
    await w.find('.close-btn').trigger('click')
    expect(w.emitted('close')).toHaveLength(2)
  })
})
