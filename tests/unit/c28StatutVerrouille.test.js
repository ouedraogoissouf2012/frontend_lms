/**
 * C28 (contrat back #1037) : une copie `verrouille` (remise refusée hors délai, ou tentative échue
 * jamais remise) est gardée, visible, jamais notée. Décisions de la superviseure :
 * - D-28f : côté élève, elle n'est plus « à faire » (rien à y faire) ; elle va avec les évaluations
 *   passées, badge « Hors délai, non remise », jamais confondue avec une copie remise ;
 *   `ouvrirEvaluation` est inchangé (le serveur décide d'une nouvelle tentative) ;
 * - D-28g : enseignant et admin, libellé « Hors délai » ; carte `etudiants_hors_delai`, « — » si la
 *   clé est absente (serveur d'avant C28), jamais un 0 fabriqué.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ get: vi.fn(), push: vi.fn(), demarrer: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '42' } }),
  useRouter: () => ({ push: h.push, back: vi.fn() }),
}))
vi.mock('@/services/api', () => ({
  default: { get: (...a) => h.get(...a) },
  auth: { getUser: () => ({ id: 1, klassci_id: 7 }) },
}))
vi.mock('@/services/evaluation', () => ({ default: { startEvaluation: (...a) => h.demarrer(...a) } }))
vi.mock('@/composables/useToast', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }))

import { getStatusLabel, getStatusClass, copieRendue } from '@/utils/studentEvaluationStatus'
import * as correction from '@/utils/evaluationCorrectionsFormat'
import { useStudentEvaluationsList } from '@/composables/useStudentEvaluationsList'
import { useStartEvaluation } from '@/composables/useStartEvaluation'
import { useAdminEvaluationDetails } from '@/composables/useAdminEvaluationDetails'
import StudentEvalPracticeCard from '@/components/student/StudentEvalPracticeCard.vue'
import CorrectionStats from '@/components/evaluations/CorrectionStats.vue'

const VERROUILLEE = { id: 10, status: 'verrouille' }
const OUVERTE = { has_started: true, is_open: true }
const CLOSE = { has_started: true, is_open: false }

async function monter(fabrique) {
  let api
  mount(defineComponent({ setup() { api = fabrique(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => { vi.clearAllMocks() })

describe('élève : une copie verrouillée est hors délai, non remise (D-28f)', () => {
  it('9. libellé « Hors délai, non remise », sa classe, jamais une copie rendue ; la carte porte le badge', () => {
    const e = { id: 1, programmation: { window: OUVERTE }, student_submission: VERROUILLEE }
    expect(getStatusLabel(e)).toBe('Hors délai, non remise')
    expect(getStatusClass(e)).toBe('status-late')
    expect(copieRendue(VERROUILLEE)).toBe(false)
    const carte = mount(StudentEvalPracticeCard, { props: { evaluation: e } })
    expect(carte.text()).toContain('Hors délai, non remise')
    expect(carte.text()).not.toContain('Entraînement')
  })

  it('10. jamais « terminées », jamais « à faire » ; toujours avec les évaluations passées', async () => {
    h.get.mockResolvedValue({
      success: true,
      data: [
        { id: 1, titre: 'Ouverte', programmation: { window: OUVERTE }, student_submission: VERROUILLEE },
        { id: 2, titre: 'Close', programmation: { window: CLOSE }, student_submission: { ...VERROUILLEE, id: 11 } },
      ],
    })
    const u = await monter(useStudentEvaluationsList)
    expect(u.evaluationsTerminees.value).toEqual([])
    expect(u.evaluationsAFaire.value).toEqual([])
    expect(u.evaluationsEntrainement.value.map((e) => e.id)).toEqual([1, 2])
  })

  it('11. ouvrirEvaluation sur une copie verrouillée → démarrage (inchangé, le serveur décide)', async () => {
    h.demarrer.mockResolvedValue({ success: true, data: { id: 12 } })
    const s = await monter(useStartEvaluation)
    await s.ouvrirEvaluation({ id: 5, student_submission: VERROUILLEE })
    expect(h.demarrer).toHaveBeenCalledWith(5, 7)
  })
})

describe('enseignant et admin : la copie hors délai se voit (D-28g)', () => {
  it('12. corrections : libellé « Hors délai » et sa classe', () => {
    expect(correction.getStatusLabel('verrouille')).toBe('Hors délai')
    expect(correction.getStatusClass('verrouille')).toBe('status-late')
  })

  it('13. carte « Hors délai » : la valeur du serveur, « — » si la clé est absente', () => {
    const avec = mount(CorrectionStats, { props: { statistiques: { etudiants_hors_delai: 2 } } })
    expect(avec.find('[data-test="stat-hors-delai"]').text()).toBe('2')
    const sans = mount(CorrectionStats, { props: { statistiques: {} } })
    expect(sans.find('[data-test="stat-hors-delai"]').text()).toBe('—')
    const zero = mount(CorrectionStats, { props: { statistiques: { etudiants_hors_delai: 0 } } })
    expect(zero.find('[data-test="stat-hors-delai"]').text()).toBe('0')
  })

  it('14. admin : libellé « Hors délai »', async () => {
    h.get.mockResolvedValue({ success: true, data: {} })
    const a = await monter(useAdminEvaluationDetails)
    expect(a.getStatusLabel('verrouille')).toBe('Hors délai')
  })
})
