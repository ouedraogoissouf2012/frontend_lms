/**
 * #578 : une programmation dont la fenêtre est OUVERTE était rangée parmi les « expirées sans version en ligne »,
 * masquées par défaut sur /teacher/evaluations (E2E 43787258943, école KLASSCI). `isExpiredWithoutOnline` rendait
 * `date_evaluation < maintenant` quelle que soit la fenêtre ; or cette date est le DÉBUT. Pendant la fenêtre, quand
 * l'enseignant veut créer la version en ligne, la carte était cachée.
 * Règle : la fenêtre, quand la charge la porte, décide seule (expirée seulement TERMINÉE) ; sans fenêtre, la FIN
 * (début + durée) décide ; sans durée, le début (comportement d'avant, rien d'inventé).
 */
import { describe, it, expect } from 'vitest'
import { isExpiredWithoutOnline } from '@/utils/evaluations'

const MIN = 60e3
const il_y_a = (minutes) => new Date(Date.now() - minutes * MIN).toISOString()

describe('#578 — la fenêtre décide', () => {
  it('ouverte (commencée, pas finie) : non expirée, même si son début est passé', () => {
    expect(isExpiredWithoutOnline({
      has_online: false,
      programmation: { date_evaluation: il_y_a(60), window: { is_open: true, has_started: true, has_ended: false } },
    })).toBe(false)
  })

  it('terminée : expirée', () => {
    expect(isExpiredWithoutOnline({
      has_online: false,
      programmation: { date_evaluation: il_y_a(600), window: { is_open: false, has_started: true, has_ended: true } },
    })).toBe(true)
  })

  it('pas encore commencée : non expirée', () => {
    expect(isExpiredWithoutOnline({
      has_online: false,
      programmation: { date_evaluation: il_y_a(-60), window: { is_open: false, has_started: false, has_ended: false } },
    })).toBe(false)
  })
})

describe('#578 — sans fenêtre, la fin (début + durée) décide', () => {
  it('commencée il y a 1 h, durée 4 h : non expirée', () => {
    expect(isExpiredWithoutOnline({ has_online: false, programmation: { date_evaluation: il_y_a(60), duree_minutes: 240 } })).toBe(false)
  })

  it('commencée il y a 5 h, durée 4 h : expirée', () => {
    expect(isExpiredWithoutOnline({ has_online: false, programmation: { date_evaluation: il_y_a(300), duree_minutes: 240 } })).toBe(true)
  })

  it('la durée à la racine (évaluation locale) compte aussi', () => {
    expect(isExpiredWithoutOnline({ has_online: false, date_evaluation: il_y_a(60), duree_minutes: 240 })).toBe(false)
  })
})
