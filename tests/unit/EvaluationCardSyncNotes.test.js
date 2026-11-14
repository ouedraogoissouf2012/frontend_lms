/**
 * Le bouton « Synchroniser les notes » (EvaluationCardActions) suit la clé que KLASSCI ENVOIE.
 *
 * Il lisait `evaluation.can_sync_grades`, une clé absente de la charge capturée : avec une vraie
 * évaluation KLASSCI, le bouton ne s'affichait jamais, et aucune note ne pouvait partir. Le droit
 * capturé est `lms_integration.can_submit_notes` (TEACHER_DASHBOARD, bloc `evaluations`). Mesuré par
 * l'E2E de l'école KLASSCI (K3, D526).
 *
 * La carte reçoit l'évaluation KLASSCI FUSIONNÉE avec sa version en ligne (mergeWithOnlineVersions),
 * comme dans TeacherEvaluations.vue.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EvaluationCardActions from '@/components/evaluations/EvaluationCardActions.vue'
import { mergeWithOnlineVersions } from '@/utils/evaluations'
import { TEACHER_DASHBOARD } from '../fixtures/klassci/teacherDashboard'

const [CAPTUREE] = TEACHER_DASHBOARD.evaluations
const BOUTON = 'Synchroniser les notes'

/** La carte d'une évaluation KLASSCI, avec une version en ligne portant `copies` copies. */
function carte(klassci, copies = 1) {
  const [evaluation] = mergeWithOnlineVersions([klassci], [{ id: 77, klassci_evaluation_id: klassci.id, submissions_count: copies, is_published: true }])
  return mount(EvaluationCardActions, { props: { evaluation } })
}
const bouton = (w) => w.findAll('button').find((b) => b.text().includes(BOUTON))

describe('EvaluationCardActions — « Synchroniser les notes » suit la clé capturée (K3, D526)', () => {
  it('la charge capturée ne porte PAS `can_sync_grades` : le droit est `lms_integration.can_submit_notes`', () => {
    expect(CAPTUREE).not.toHaveProperty('can_sync_grades')
    expect(CAPTUREE.lms_integration).toHaveProperty('can_submit_notes', true)
  })

  it('une évaluation capturée, avec des copies remises : le bouton est là, et il émet sync', async () => {
    const w = carte(CAPTUREE)
    expect(bouton(w)).toBeTruthy()
    await bouton(w).trigger('click')
    expect(w.emitted('sync')).toHaveLength(1)
  })

  it('KLASSCI refuse les notes (`can_submit_notes` faux) : pas de bouton', () => {
    const w = carte({ ...CAPTUREE, lms_integration: { ...CAPTUREE.lms_integration, can_submit_notes: false } })
    expect(bouton(w)).toBeUndefined()
  })

  it('aucune copie remise : pas de bouton (inchangé)', () => {
    expect(bouton(carte(CAPTUREE, 0))).toBeUndefined()
  })

  it('une évaluation créée dans le LMS, sans programmation KLASSCI : pas de bouton (rien à synchroniser)', () => {
    const [locale] = mergeWithOnlineVersions([], [{ id: 78, klassci_evaluation_id: null, submissions_count: 3, is_published: true }])
    expect(bouton(mount(EvaluationCardActions, { props: { evaluation: locale } }))).toBeUndefined()
  })
})
