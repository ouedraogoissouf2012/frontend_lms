/**
 * Test de montage de VisioManager.vue après extraction (G8).
 * Vérifie que le composant monte sans erreur et que le rendu conditionnel par rôle
 * (via auth.getUser) reste identique : bouton "Programmer en visio" pour le
 * coordinateur quand la visio n'est pas activée.
 */
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import VisioManager from '@/components/visio/VisioManager.vue'
import { auth } from '@/services/api'

function mountManager(seance = {}) {
  return mount(VisioManager, {
    props: { seance: { id: 1, ...seance } },
    global: {
      plugins: [createPinia()],
      stubs: { ParticipantsModal: true }
    }
  })
}

describe('VisioManager.vue (G8) — montage', () => {
  let getUserSpy

  beforeEach(() => {
    getUserSpy = vi.spyOn(auth, 'getUser').mockReturnValue(null)
  })
  afterEach(() => {
    getUserSpy.mockRestore()
  })

  it('monte sans erreur (racine .visio-manager présente)', () => {
    const w = mountManager()
    expect(w.find('.visio-manager').exists()).toBe(true)
  })

  it('coordinateur + visio désactivée → bouton "Programmer en visio"', () => {
    getUserSpy.mockReturnValue({ role: 'coordinateur' })
    const w = mountManager({ visio_enabled: false })
    expect(w.text()).toContain('Programmer en visio')
  })

  it('étudiant + visio activée non démarrée → message d’attente', () => {
    getUserSpy.mockReturnValue({ role: 'etudiant' })
    const w = mountManager({ visio_enabled: true, visio_active: false })
    expect(w.text()).toContain("lorsque l'enseignant la démarrera")
  })

  it('formatTime expose HH:MM via l’horaire de séance enseignant', () => {
    getUserSpy.mockReturnValue({ role: 'enseignant' })
    const w = mountManager({
      visio_enabled: true,
      programmation: { heure_debut: '2025-10-20T09:00:00.000Z', heure_fin: '2025-10-20T11:00:00.000Z' }
    })
    expect(w.text()).toMatch(/Séance programmée: \d{2}:\d{2} - \d{2}:\d{2}/)
  })
})
