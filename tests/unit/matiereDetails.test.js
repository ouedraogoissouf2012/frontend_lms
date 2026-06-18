/**
 * Tests de la logique pure des détails de matière (#28 — MatiereDetails.vue).
 */
import { describe, it, expect } from 'vitest'
import {
  calculateSeanceDuration,
  getSeanceStatusClass,
  getSeanceStatusLabel,
  getEvaluationStatusClass,
  getEvaluationStatusLabel
} from '@/utils/matiereDetails'

describe('utils/matiereDetails — calculateSeanceDuration', () => {
  it('calcule la durée en minutes', () => {
    expect(calculateSeanceDuration({
      programmation: { heure_debut: '2026-06-18T10:00:00', heure_fin: '2026-06-18T11:30:00' }
    })).toBe(90)
  })
  it('0 si données manquantes ou invalides', () => {
    expect(calculateSeanceDuration({})).toBe(0)
    expect(calculateSeanceDuration({ programmation: { heure_debut: 'x', heure_fin: 'y' } })).toBe(0)
  })
})

describe('utils/matiereDetails — statut séance', () => {
  const dateOnly = (d) => d.toISOString().split('T')[0]
  it('à venir si dans le futur', () => {
    const tomorrow = dateOnly(new Date(Date.now() + 86400000))
    const s = { date_seance: tomorrow, heure_debut: '10:00', heure_fin: '11:00' }
    expect(getSeanceStatusLabel(s)).toBe('À venir')
    expect(getSeanceStatusClass(s)).toContain('orange')
  })
  it('terminé si passé et réalisé', () => {
    const yesterday = dateOnly(new Date(Date.now() - 86400000))
    const s = { date_seance: yesterday, heure_debut: '10:00', heure_fin: '11:00', statut: 'realise' }
    expect(getSeanceStatusLabel(s)).toBe('Terminé')
  })
  it('passé sinon', () => {
    const yesterday = dateOnly(new Date(Date.now() - 86400000))
    const s = { date_seance: yesterday, heure_debut: '10:00', heure_fin: '11:00' }
    expect(getSeanceStatusLabel(s)).toBe('Passé')
  })
})

describe('utils/matiereDetails — statut évaluation', () => {
  it('pas encore ouverte', () => {
    expect(getEvaluationStatusLabel({ has_started: false })).toBe('Pas encore ouverte')
    expect(getEvaluationStatusClass({ has_started: false })).toContain('orange')
  })
  it('ouverte', () => {
    expect(getEvaluationStatusLabel({ has_started: true, is_open: true })).toBe('Ouverte')
    expect(getEvaluationStatusClass({ has_started: true, is_open: true })).toContain('green')
  })
  it('fermée', () => {
    expect(getEvaluationStatusLabel({ has_started: true, is_open: false })).toBe('Fermée')
    expect(getEvaluationStatusClass({ has_started: true, is_open: false })).toContain('gray')
  })
})
