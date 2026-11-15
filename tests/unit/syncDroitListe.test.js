/**
 * D588 : le droit de synchroniser les notes, sur la forme RÉELLE de la liste des évaluations.
 *
 * La liste (`GET evaluations`, relayée par `/proxy/evaluations` : celle de l'écran enseignant) ne porte PAS
 * `lms_integration.can_submit_notes` ; seul le tableau de bord le porte (forme mesurée, D582). #552 normalisait le
 * droit depuis cette seule clé : en réel, il valait toujours faux, et le bouton ne s'affichait jamais.
 * La règle : le droit de la source quand elle le porte ; sinon on ne bloque pas, et le bouton dépend de la version
 * en ligne (`has_online`, vérité du LMS) et des copies remises (`submissions_to_sync_count`). Le serveur tranche.
 * Le sens de `has_online_version`, `notes_published` et `can_execute_online` n'est pas établi : ils ne sont pas lus.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EvaluationCardActions from '@/components/evaluations/EvaluationCardActions.vue'
import { mergeWithOnlineVersions } from '@/utils/evaluations'
import { exempleMesure } from '../fixtures/klassci/formesMesurees'
import { TEACHER_DASHBOARD } from '../fixtures/klassci/teacherDashboard'

const BOUTON = 'Synchroniser les notes'
// Une évaluation de la LISTE, de forme mesurée (ses valeurs sont fabriquées : seule la forme compte).
const LISTE = { ...exempleMesure('GET /evaluations', '$.data[]'), id: 5 }
const [TABLEAU] = TEACHER_DASHBOARD.evaluations

const versionEnLigne = (klassciId, remises) => ({ id: 77, klassci_evaluation_id: klassciId, submissions_count: remises, submissions_to_sync_count: remises, is_published: true })
const carte = (klassci, versions) => mergeWithOnlineVersions([klassci], versions)[0]
const bouton = (evaluation) => mount(EvaluationCardActions, { props: { evaluation } })
  .findAll('button').find((b) => b.text().includes(BOUTON))

describe('D588 — le droit de synchroniser, sur la forme réelle de la liste', () => {
  it('la liste mesurée ne porte pas `can_submit_notes`', () => {
    expect(LISTE.lms_integration).toBeTruthy()
    expect(LISTE.lms_integration).not.toHaveProperty('can_submit_notes')
  })

  it('liste, une version en ligne et une copie remise : le droit est vrai, et le bouton est là', () => {
    const evaluation = carte(LISTE, [versionEnLigne(5, 1)])
    expect(evaluation.can_sync_grades).toBe(true)
    expect(bouton(evaluation)).toBeTruthy()
  })

  it('liste, sans version en ligne dans le LMS : pas de bouton', () => {
    expect(bouton(carte(LISTE, []))).toBeUndefined()
  })

  it('liste, aucune copie remise : pas de bouton', () => {
    expect(bouton(carte(LISTE, [versionEnLigne(5, 0)]))).toBeUndefined()
  })

  it('tableau de bord, `can_submit_notes` faux : pas de bouton, même avec des copies remises', () => {
    const refuse = { ...TABLEAU, lms_integration: { ...TABLEAU.lms_integration, can_submit_notes: false } }
    expect(bouton(carte(refuse, [versionEnLigne(TABLEAU.id, 2)]))).toBeUndefined()
  })

  it('tableau de bord, `can_submit_notes` vrai : le bouton est là', () => {
    expect(bouton(carte(TABLEAU, [versionEnLigne(TABLEAU.id, 2)]))).toBeTruthy()
  })
})
