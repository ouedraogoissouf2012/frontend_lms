/**
 * Tests de montage des sous-composants SeanceDetailsHeader et
 * SeanceDetailsVisio (#H6). Composants feuilles : pas de service/store,
 * seules les intentions d'action sont émises vers la vue parente.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeanceDetailsHeader from '@/components/seances/SeanceDetailsHeader.vue'
import SeanceDetailsVisio from '@/components/seances/SeanceDetailsVisio.vue'

const $router = { back: () => {} }

describe('SeanceDetailsHeader (#H6)', () => {
  const seance = {
    matiere: { nom: 'Maths' },
    classe: { nom: '6e A' },
    programmation: { date: '2026-06-20', heure_debut: '2026-06-20T08:00:00', heure_fin: '2026-06-20T10:00:00' },
    duree_minutes: 120
  }

  it('affiche titre, classe et émet "hide" pour un étudiant', async () => {
    const w = mount(SeanceDetailsHeader, {
      props: { seance, isTeacher: false },
      global: { mocks: { $router } }
    })
    expect(w.text()).toContain('Maths')
    expect(w.text()).toContain('6e A')
    // bouton « Masquer » présent pour non-enseignant
    const hideBtn = w.findAll('button').find(b => b.text().includes('Masquer'))
    await hideBtn.trigger('click')
    expect(w.emitted('hide')).toBeTruthy()
  })

  it('cache le bouton « Masquer » pour un enseignant', () => {
    const w = mount(SeanceDetailsHeader, {
      props: { seance, isTeacher: true },
      global: { mocks: { $router } }
    })
    expect(w.findAll('button').some(b => b.text().includes('Masquer'))).toBe(false)
  })
})

describe('SeanceDetailsVisio (#H6)', () => {
  const seance = { heure_debut: '08:00' }

  it('enseignant + can_start : émet "start"', async () => {
    const visio = { enabled: true, status: 'programmee', window: { can_start: true, has_started: false } }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: true, isStudent: false }
    })
    await w.find('button').trigger('click')
    expect(w.emitted('start')).toBeTruthy()
  })

  it('cours actif : affiche EN DIRECT et émet "join"', async () => {
    const visio = { enabled: true, status: 'active', window: {} }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: true, isStudent: false }
    })
    expect(w.text()).toContain('COURS EN DIRECT')
    await w.find('button').trigger('click')
    expect(w.emitted('join')).toBeTruthy()
  })

  it('recording en cours : affiche statut et bannière de consentement sans contrôles recording', () => {
    const visio = {
      enabled: true,
      status: 'active',
      recording: { status: 'recording' },
      window: { has_started: true, is_in_window: true }
    }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: false, isStudent: true }
    })

    expect(w.find('[data-test="recording-status"]').text()).toContain('Enregistrement en cours')
    expect(w.find('[data-test="recording-consent"]').text()).toContain('Cette séance est enregistrée')
    expect(w.text()).not.toContain("Démarrer l'enregistrement")
    expect(w.text()).not.toContain("Arrêter l'enregistrement")
  })

  it('recording en traitement : affiche le statut sans bannière consentement', () => {
    const visio = {
      enabled: true,
      status: 'active',
      recording: { status: 'processing' },
      window: { has_started: true, is_in_window: true }
    }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: true, isStudent: false }
    })

    expect(w.find('[data-test="recording-status"]').text()).toContain("Traitement de l'enregistrement")
    expect(w.find('[data-test="recording-consent"]').exists()).toBe(false)
  })

  it('recording prêt : affiche le statut disponible', () => {
    const visio = {
      enabled: true,
      status: 'terminee',
      recording: { status: 'ready', url: 'https://cdn.example.test/seance.mp4' },
      window: { has_started: true, has_ended: true }
    }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: false, isStudent: true }
    })

    expect(w.find('[data-test="recording-status"]').text()).toContain('Enregistrement disponible')
  })

  it('recording échoué : affiche le statut et le message backend', () => {
    const visio = {
      enabled: true,
      status: 'terminee',
      recording: { status: 'failed', error_message: 'Stockage indisponible' },
      window: { has_started: true, has_ended: true }
    }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: false, isStudent: true }
    })

    const status = w.find('[data-test="recording-status"]').text()
    expect(status).toContain("Échec de l'enregistrement")
    expect(status).toContain('Stockage indisponible')
  })

  it('cours terminé : affiche recording_url legacy comme lien sécurisé', () => {
    const visio = {
      enabled: true,
      status: 'terminee',
      recording_url: 'https://cdn.example.test/seance.mp4',
      window: { has_started: true, has_ended: true }
    }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: false, isStudent: true }
    })

    const link = w.find('a')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain("Voir l'enregistrement")
    expect(link.attributes('href')).toBe('https://cdn.example.test/seance.mp4')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('cours terminé : affiche le futur objet recording prêt', () => {
    const visio = {
      enabled: true,
      status: 'terminee',
      recording: { status: 'ready', url: 'https://cdn.example.test/future.mp4' },
      window: { has_started: true, has_ended: true }
    }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: false, isStudent: true }
    })

    expect(w.find('a').attributes('href')).toBe('https://cdn.example.test/future.mp4')
  })

  it('cours terminé : ne rend pas un lien recording_url dangereux', () => {
    const visio = {
      enabled: true,
      status: 'terminee',
      recording_url: 'javascript:alert(1)',
      window: { has_started: true, has_ended: true }
    }
    const w = mount(SeanceDetailsVisio, {
      props: { visio, seance, isTeacher: false, isStudent: true }
    })

    expect(w.find('a').exists()).toBe(false)
    expect(w.text()).not.toContain("Voir l'enregistrement")
  })
})
