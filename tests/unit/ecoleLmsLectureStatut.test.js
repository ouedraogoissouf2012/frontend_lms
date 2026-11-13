/**
 * Lecture honnête (spec 3d à 25728cf8) : le statut d'une séance se lit d'abord sur sa visio (active,
 * terminée), puis sur l'horaire ; une fin ESTIMÉE (`heure_fin_estimee`, +2 h non mesurée) n'affirme
 * jamais « Terminée ». Une seule règle, partagée par la liste des séances et les visios d'admin.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { statutSeance, libelleStatutSeance } from '@/utils/seanceStatut'
import SeancesList from '@/components/admin/SeancesList.vue'

const H = 3600e3
const maintenant = new Date('2026-11-12T12:00:00Z')
const iso = (decalage) => new Date(maintenant.getTime() + decalage).toISOString()

describe('statutSeance — la visio d’abord, jamais « Terminée » sur une fin estimée', () => {
  it('visio terminée → terminée ; visio active → en cours, même après la fin estimée', () => {
    expect(statutSeance({ visio_status: 'terminee', visio_active: true }, maintenant)).toBe('completed')
    expect(statutSeance({ visio_active: true, heure_fin_estimee: true, date_debut: iso(-3 * H), date_fin: iso(-H) }, maintenant)).toBe('active')
  })

  it('pas encore commencée → planifiée ; fin estimée passée, sans visio → non confirmée', () => {
    expect(statutSeance({ date_debut: iso(H), date_fin: iso(3 * H) }, maintenant)).toBe('scheduled')
    expect(statutSeance({ heure_fin_estimee: true, date_debut: iso(-3 * H), date_fin: iso(-H) }, maintenant)).toBe('unconfirmed')
  })

  it('fin RÉELLE : la fenêtre horaire décide comme avant', () => {
    expect(statutSeance({ heure_fin_estimee: false, date_debut: iso(-H), date_fin: iso(H) }, maintenant)).toBe('active')
    expect(statutSeance({ heure_fin_estimee: false, date_debut: iso(-3 * H), date_fin: iso(-H) }, maintenant)).toBe('completed')
  })

  // Revue croisée de Fille 1 (D184) : « Non confirmée » seulement une fois la fin estimée PASSÉE.
  describe('fin estimée, sans visio : un statut par intervalle', () => {
    const estimee = (debut, fin) => ({ heure_fin_estimee: true, date_debut: iso(debut), date_fin: iso(fin) })

    it('avant le début → planifiée', () => {
      expect(statutSeance(estimee(H, 3 * H), maintenant)).toBe('scheduled')
    })

    it('entre le début et la fin estimée → en cours (et l’écran dit « fin estimée »)', () => {
      expect(statutSeance(estimee(-H, H), maintenant)).toBe('active')
    })

    it('après la fin estimée → non confirmée, jamais terminée', () => {
      expect(statutSeance(estimee(-3 * H, -H), maintenant)).toBe('unconfirmed')
    })

    it('drapeau porté par programmation seulement : même règle (finEstimee)', () => {
      const prog = (debut, fin) => ({ programmation: { heure_fin_estimee: true }, date_debut: iso(debut), date_fin: iso(fin) })
      expect(statutSeance(prog(-H, H), maintenant)).toBe('active')
      expect(statutSeance(prog(-3 * H, -H), maintenant)).toBe('unconfirmed')
    })
  })

  it('les libellés', () => {
    expect(libelleStatutSeance('unconfirmed')).toBe('Non confirmée')
    expect(libelleStatutSeance('completed')).toBe('Terminée')
  })
})

describe('SeancesList — une fin estimée se dit', () => {
  const seance = (o) => ({ id: 1, matiere: { nom: 'M' }, classe: { nom: 'C' }, enseignant: { nom: 'E' }, ...o })

  it('fin estimée passée : ni « Terminée » ni horaire de fin présenté comme un fait', () => {
    const w = mount(SeancesList, { props: { seances: [seance({ heure_fin_estimee: true, date_debut: iso(-30 * 24 * H), date_fin: iso(-30 * 24 * H + 2 * H) })] } })
    expect(w.text()).not.toContain('Terminée')
    expect(w.text()).toContain('fin estimée')
  })

  it('fin réelle : pas de mention « fin estimée »', () => {
    const w = mount(SeancesList, { props: { seances: [seance({ heure_fin_estimee: false, date_debut: iso(-30 * 24 * H), date_fin: iso(-30 * 24 * H + 2 * H) })] } })
    expect(w.text()).not.toContain('fin estimée')
  })
})
