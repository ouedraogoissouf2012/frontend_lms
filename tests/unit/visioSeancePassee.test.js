/**
 * Une séance PASSÉE ne propose plus « Démarrer la visio » (signalé par le user, capture en prod : séance du
 * 19 mai 2026, « Passé », bouton encore affiché). La règle est celle du serveur, une seule :
 * SeanceVisioEnricher::buildVisioWindow, `can_start` jusqu'à `heure_fin + 30 min` (`end_window`). Le front lit
 * `end_window` quand la charge le porte, sinon calcule la même fenêtre depuis l'horaire. Un horaire illisible
 * ne cache rien : le serveur tranche. L'écran DIT pourquoi le bouton n'est plus là.
 */
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { finDeFenetreVisio, visioPassee, VISIO_SEANCE_PASSEE } from '@/utils/visioTimeWindow'
import VisioManager from '@/components/visio/VisioManager.vue'
import VisioSeanceCard from '@/components/visio/VisioSeanceCard.vue'
import { useEventDetail } from '@/composables/useEventDetail'
import { auth } from '@/services/api'

const MIN = 60 * 1000
const MAINTENANT = new Date(2026, 10, 15, 12, 0, 0)
const iso = (d) => d.toISOString()
// Une séance finie depuis `minutes` (LMS : heures ISO dans `programmation`).
const finieDepuis = (minutes) => ({
  programmation: { heure_debut: iso(new Date(MAINTENANT - (minutes + 120) * MIN)), heure_fin: iso(new Date(MAINTENANT - minutes * MIN)) },
})
const PASSEE = { id: 7, visio_enabled: true, visio_active: false, programmation: { date: '2026-05-19', heure_debut: '08:00', heure_fin: '10:00' } }
const A_VENIR = { id: 8, visio_enabled: true, visio_active: false, programmation: { date: '2099-05-19', heure_debut: '08:00', heure_fin: '10:00' } }

describe('visioTimeWindow — la fin de la fenêtre de démarrage', () => {
  it('celle du serveur quand la charge la porte (visio_window, visio.window)', () => {
    const fin = '2026-11-15T10:30:00Z'
    expect(finDeFenetreVisio({ visio_window: { end_window: fin } })).toEqual(new Date(fin))
    expect(finDeFenetreVisio({ visio: { window: { end_window: fin } } })).toEqual(new Date(fin))
  })

  it('sinon la fin de la séance + 30 min : heure ISO (école LMS), jour + « HH:mm » (KLASSCI), ou à la racine', () => {
    expect(finDeFenetreVisio({ programmation: { heure_fin: '2026-11-15T10:00:00Z' } })).toEqual(new Date('2026-11-15T10:30:00Z'))
    expect(finDeFenetreVisio(PASSEE)).toEqual(new Date(2026, 4, 19, 10, 30, 0))
    expect(finDeFenetreVisio({ date_seance: '2026-05-19', heure_fin: '10:00:00' })).toEqual(new Date(2026, 4, 19, 10, 30, 0))
  })

  it('un horaire illisible : null, rien n’est inventé', () => {
    expect(finDeFenetreVisio({})).toBeNull()
    expect(finDeFenetreVisio({ programmation: { date: '2026-05-19', heure_fin: 'x' } })).toBeNull()
  })
})

describe('visioTimeWindow — la visio ne peut plus démarrer', () => {
  it('passée au-delà de la fin + 30 min', () => {
    expect(visioPassee(finieDepuis(31), MAINTENANT)).toBe(true)
  })

  it('pas encore : dans les 30 min après la fin, pendant, ou avant', () => {
    expect(visioPassee(finieDepuis(29), MAINTENANT)).toBe(false)
    expect(visioPassee(finieDepuis(-60), MAINTENANT)).toBe(false)
  })

  it('horaire illisible : jamais « passée » (le serveur tranche)', () => {
    expect(visioPassee({}, MAINTENANT)).toBe(false)
  })

  it('le motif affiché', () => {
    expect(VISIO_SEANCE_PASSEE).toBe('Séance passée : la visio ne peut plus être démarrée.')
  })
})

describe('VisioManager — l’enseignant sur une séance passée', () => {
  let getUserSpy
  beforeEach(() => { getUserSpy = vi.spyOn(auth, 'getUser').mockReturnValue({ role: 'enseignant' }) })
  afterEach(() => getUserSpy.mockRestore())
  const monter = (seance) => mount(VisioManager, { props: { seance }, global: { plugins: [createPinia()], stubs: { ParticipantsModal: true } } })

  it('séance passée : pas de « Démarrer la visio », et l’écran dit pourquoi', () => {
    const texte = monter(PASSEE).text()
    expect(texte).not.toContain('Démarrer la visio')
    expect(texte).toContain(VISIO_SEANCE_PASSEE)
  })

  it('séance à venir : le bouton reste, sans le motif', () => {
    const texte = monter(A_VENIR).text()
    expect(texte).toContain('Démarrer la visio')
    expect(texte).not.toContain(VISIO_SEANCE_PASSEE)
  })
})

describe('VisioSeanceCard — la carte « à venir » d’une séance passée', () => {
  const monter = (seance) => mount(VisioSeanceCard, { props: { seance, formatDate: () => 'd', formatTime: () => 't' } })

  it('passée : pas de « Démarrer la visio », le motif est dit', () => {
    const texte = monter(PASSEE).text()
    expect(texte).not.toContain('Démarrer la visio')
    expect(texte).toContain(VISIO_SEANCE_PASSEE)
  })

  it('à venir : le bouton reste', () => {
    expect(monter(A_VENIR).text()).toContain('Démarrer la visio')
  })
})

describe('useEventDetail — le calendrier ne propose pas de démarrer une séance passée', () => {
  const capacite = (data) => {
    let api
    mount(defineComponent({ setup() { api = useEventDetail({ event: { extendedProps: { eventType: 'seance', data } }, userRole: 'teacher' }, () => {}); return () => null } }))
    return api
  }

  it('passée : pas de démarrage, et le motif est exposé', () => {
    const api = capacite({ ...PASSEE, visio: { enabled: true, status: 'programmee' } })
    expect(api.canStartVisio.value).toBe(false)
    expect(api.motifVisioFermee.value).toBe(VISIO_SEANCE_PASSEE)
  })

  it('à venir : démarrer reste possible, aucun motif', () => {
    const api = capacite({ ...A_VENIR, visio: { enabled: true, status: 'programmee' } })
    expect(api.canStartVisio.value).toBe(true)
    expect(api.motifVisioFermee.value).toBeNull()
  })
})

describe('le refus du serveur : reason « seance_past » (409, contrat du Réparateur)', () => {
  it('son texte vient du CATALOGUE, distinct de la note informative (un texte du catalogue à l’écran est une erreur)', async () => {
    const { messageForReason } = await import('@/services/errorHandler')
    expect(messageForReason('seance_past')).toBe('Cette séance est passée : sa visio ne peut plus être démarrée ni rejointe.')
    expect(messageForReason('seance_past')).not.toBe(VISIO_SEANCE_PASSEE)
  })
})
