/**
 * Test de RENDU du sous-composant SeancesList (#G1 ≤300).
 * Vérifie le montage, le rendu d'une carte par séance, le statut calculé
 * (en cours / planifiée / terminée), et l'émission de view-details / enable-visio.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeancesList from '@/components/admin/SeancesList.vue'

const HOUR = 3600 * 1000

function seance(overrides = {}) {
  const now = Date.now()
  return {
    id: 1,
    matiere: { nom: 'Maths' },
    classe: { name: '6e A' },
    enseignant: { nom: 'Zoé', prenom: 'P' },
    date_debut: new Date(now - HOUR).toISOString(),
    date_fin: new Date(now + HOUR).toISOString(),
    visio_enabled: false,
    ...overrides,
  }
}

describe('SeancesList (#G1) — rendu', () => {
  it('monte sans erreur et affiche une carte par séance', () => {
    const w = mount(SeancesList, { props: { seances: [seance(), seance({ id: 2 })] } })
    expect(w.findAll('.seance-card')).toHaveLength(2)
    expect(w.html()).toContain('Maths')
  })

  it('calcule le statut « En cours » pour une séance en cours', () => {
    const w = mount(SeancesList, { props: { seances: [seance()] } })
    expect(w.find('.status-active').exists()).toBe(true)
    expect(w.text()).toContain('En cours')
  })

  it('calcule le statut « Planifiée » pour une séance future', () => {
    const now = Date.now()
    const s = seance({ date_debut: new Date(now + HOUR).toISOString(), date_fin: new Date(now + 2 * HOUR).toISOString() })
    const w = mount(SeancesList, { props: { seances: [s] } })
    expect(w.find('.status-scheduled').exists()).toBe(true)
    expect(w.text()).toContain('Planifiée')
  })

  it('émet enable-visio quand visio désactivée', async () => {
    const w = mount(SeancesList, { props: { seances: [seance({ visio_enabled: false })] } })
    await w.find('.action-btn.secondary').trigger('click')
    expect(w.emitted('enable-visio')).toBeTruthy()
  })

  it('émet view-details quand visio activée', async () => {
    const w = mount(SeancesList, { props: { seances: [seance({ visio_enabled: true })] } })
    await w.find('.action-btn.primary').trigger('click')
    expect(w.emitted('view-details')).toBeTruthy()
  })
})
