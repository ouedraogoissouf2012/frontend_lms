/**
 * Outil E2E : un refus MÉTIER du serveur sur un écran que le routeur ouvre (décision de la superviseure,
 * 14/11). Le coordinateur ne prévisualise que les évaluations terminées
 * (TeacherEvaluationViewService::preview:140-147) : sur une évaluation en cours, la case attend le 403.
 */
import { describe, it, expect } from 'vitest'
import { refusServeur, REFUS_SERVEUR } from '../../e2e/acces.mjs'

const PREVIEW = { chemin: '/coordinateur/evaluations/:id/preview' }

describe('acces.mjs — refus métier du serveur', () => {
  it('le coordinateur sur la prévisualisation : refus 403 attendu, avec sa règle', () => {
    expect(refusServeur(PREVIEW, 'coordinateur')).toMatchObject({ statut: 403, regle: expect.stringContaining('terminées') })
  })

  it('les autres rôles et écrans ne sont pas concernés', () => {
    expect(refusServeur(PREVIEW, 'admin')).toBeNull()
    expect(refusServeur({ chemin: '/teacher/evaluations/:id/preview' }, 'coordinateur')).toBeNull()
    expect(Object.isFrozen(REFUS_SERVEUR)).toBe(true)
  })
})
