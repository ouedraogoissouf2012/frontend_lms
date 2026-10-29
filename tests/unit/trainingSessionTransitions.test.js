/**
 * Transitions d'une période (#391) : la table front recopie l'ADR-845-01 du backend
 * (TrainingSessionTransitionService).
 *
 * LIMITE, dite honnêtement (revue #441, A5) : ce test compare la table à un LITTÉRAL
 * écrit ici, pas au serveur. Il épingle la copie contre elle-même : il rougit si
 * quelqu'un modifie la table sans le vouloir, mais PAS si le graphe du backend change.
 * Seule lms_backend#956 (le serveur publie les transitions possibles) fermera ce trou.
 */
import { describe, it, expect } from 'vitest'
import { TRANSITIONS, transitionsPermises, raisonBlocage } from '@/constants/trainingSessionTransitions'

const periode = (status, extra = {}) => ({ id: 1, status, starts_on: '2026-11-02', ...extra })

describe('table des transitions (ADR-845-01)', () => {
  it('copie exacte du graphe serveur', () => {
    expect(TRANSITIONS).toEqual({
      publier: ['brouillon'],
      annuler: ['brouillon', 'publiee'],
      cloturer: ['publiee'],
      archiver: ['cloturee', 'annulee'],
    })
  })

  it.each([
    ['brouillon', ['publier', 'annuler']],
    ['publiee', ['annuler', 'cloturer']],
    ['cloturee', ['archiver']],
    ['annulee', ['archiver']],
    ['archivee', []],
    ['purgee', []],
  ])('%s → %o', (status, attendu) => {
    expect(transitionsPermises(periode(status))).toEqual(attendu)
  })

  it('un statut inconnu ne propose rien (le serveur reste l’autorité)', () => {
    expect(transitionsPermises(periode('reportee'))).toEqual([])
    expect(transitionsPermises(null)).toEqual([])
  })
})

describe('publier exige une date de début (ADR-845-01)', () => {
  it('sans starts_on, publier reste listé mais bloqué, avec sa raison', () => {
    const p = periode('brouillon', { starts_on: null })
    expect(transitionsPermises(p)).toContain('publier')
    expect(raisonBlocage(p, 'publier')).toBe('Ajoutez une date de début pour publier.')
  })

  it('avec starts_on, rien ne bloque', () => {
    expect(raisonBlocage(periode('brouillon'), 'publier')).toBe(null)
    expect(raisonBlocage(periode('publiee'), 'annuler')).toBe(null)
  })
})
