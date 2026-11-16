/**
 * #569 : « Modifier les questions » restait actif sur une évaluation VERROUILLÉE (des copies existent, ou le
 * drapeau `is_locked`), puis l'enregistrement était refusé en 403. Un bouton qui mène à un refus est une
 * impasse. La règle est celle du serveur (EvaluationStateService::isLocked, exposé en `is_locked`), et la même
 * que celle qui masque déjà « Supprimer » : le bouton n'est plus proposé, et la carte DIT pourquoi.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EvaluationCardActions from '@/components/evaluations/EvaluationCardActions.vue'
import { QUESTIONS_VERROUILLEES } from '@/utils/evaluations'

const carte = (versionEnLigne) => mount(EvaluationCardActions, {
  props: { evaluation: { id: 5, titre: 'Devoir', has_online: true, online_version: { id: 77, ...versionEnLigne } } },
})
const modifier = (w) => w.findAll('button').find((b) => b.text().includes('Modifier les questions'))

describe('#569 — « Modifier les questions » sur une évaluation verrouillée', () => {
  it('des copies existent : pas de bouton, la carte dit pourquoi', () => {
    const w = carte({ submissions_count: 2, is_locked: true })
    expect(modifier(w)).toBeUndefined()
    expect(w.text()).toContain(QUESTIONS_VERROUILLEES)
  })

  it('le drapeau de verrou seul suffit (règle du serveur)', () => {
    const w = carte({ submissions_count: 0, is_locked: true })
    expect(modifier(w)).toBeUndefined()
    expect(w.text()).toContain(QUESTIONS_VERROUILLEES)
  })

  it('le compte de copies seul suffit (une réponse sans `is_locked`)', () => {
    expect(modifier(carte({ submissions_count: 1 }))).toBeUndefined()
  })

  it('sans copie ni verrou : le bouton reste, sans motif', () => {
    const w = carte({ submissions_count: 0, is_locked: false })
    expect(modifier(w)).toBeTruthy()
    expect(w.text()).not.toContain(QUESTIONS_VERROUILLEES)
  })

  it('le motif affiché', () => {
    expect(QUESTIONS_VERROUILLEES).toBe('Questions verrouillées : des copies existent déjà, ou l’évaluation a été verrouillée.')
  })
})

describe('back #1113 — le refus « evaluation_locked » (409) est dit par le catalogue', () => {
  it('le motif vrai (les copies remises), jamais le 403 générique « droits »', async () => {
    const { messageForReason } = await import('@/services/errorHandler')
    expect(messageForReason('evaluation_locked')).toBe('Cette évaluation est verrouillée : des copies ont déjà été remises. Elle ne peut plus être modifiée ni supprimée.')
  })
})
