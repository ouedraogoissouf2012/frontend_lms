/**
 * front#693 (contrat back #1773) : l'enseignant publie les notes et règle l'ouverture du corrigé, à l'écran ;
 * l'élève lit un message clair tant que rien n'est publié.
 *
 * - `PATCH /evaluations/{id}/release` : `show_results`, ou `correction_release` (never | with_results | after_close
 *   | at_date), et `correction_release_at` SEULEMENT pour `at_date`. La réponse remplace l'évaluation affichée.
 * - Publier ou retirer la publication passe par une confirmation ; annulée, aucune requête.
 * - Côté élève, plus AUCUN délai fixe (l'ancien « 7 jours après la remise ») : l'état du corrigé se lit dans
 *   `correction_available`, `correction_available_at` et le mode. Une note cachée ne s'affiche jamais « null/20 ».
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  releaseEvaluation: vi.fn(), confirm: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))
vi.mock('@/services/evaluation', () => ({ default: { releaseEvaluation: h.releaseEvaluation } }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: h.confirm }) }))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))

import { etatDuCorrige } from '@/utils/diffusionDesResultats'
import DiffusionEvaluation from '@/components/evaluations/DiffusionEvaluation.vue'
import EvalResultScoreHeader from '@/components/evaluations/EvalResultScoreHeader.vue'
import EvalResultCorrigeStatut from '@/components/evaluations/EvalResultCorrigeStatut.vue'
import ResultQuestionCard from '@/components/evaluations/ResultQuestionCard.vue'

const copie = (champs = {}, evaluation = {}) => ({
  submitted_at: '2026-11-20T10:00:00Z', correction_available: false, correction_available_at: null,
  correction_delay_days: null, note_sur_20: null, score: null, feedback: null,
  evaluation: { id: 42, titre: 'Maths', coefficient: 2, show_results: false, correction_release: 'with_results', ...evaluation },
  ...champs,
})
const evaluationEnseignant = (champs = {}) => ({
  id: 42, titre: 'Maths', show_results: false, correction_release: 'with_results', correction_release_at: null, ...champs,
})

describe('etatDuCorrige : un état par mode, jamais un délai fixe', () => {
  it('ouvert quand l API le dit', () => {
    expect(etatDuCorrige(copie({ correction_available: true }))).toMatchObject({ ouvert: true })
  })

  it('daté quand l API donne l instant d ouverture', () => {
    const etat = etatDuCorrige(copie({ correction_available_at: '2026-12-05T08:00:00Z' }, { correction_release: 'at_date', show_results: true }))
    expect(etat.ouvert).toBe(false)
    expect(etat.message).toContain('ouvrira le')
  })

  it('jamais : pas de corrigé prévu', () => {
    expect(etatDuCorrige(copie({}, { correction_release: 'never' })).message).toContain('Pas de corrigé prévu')
  })

  it('avec les notes, tant qu elles ne sont pas publiées', () => {
    expect(etatDuCorrige(copie({}, { correction_release: 'with_results', show_results: false })).message)
      .toContain('avec la publication des notes')
  })

  it('sans date connue : pas encore daté, et aucun compte de jours inventé', () => {
    const etat = etatDuCorrige(copie({}, { correction_release: 'after_close', show_results: true }))
    expect(etat.message).toContain('pas encore daté')
    for (const mode of ['never', 'with_results', 'after_close', 'at_date']) {
      expect(etatDuCorrige(copie({}, { correction_release: mode })).message).not.toMatch(/jour/)
    }
  })
})

describe('côté élève : rien de faux tant que rien n est publié', () => {
  it('l en-tête dit que les notes ne sont pas publiées, jamais « null/20 »', () => {
    const w = mount(EvalResultScoreHeader, { props: { submission: copie() } })
    expect(w.text()).toContain('pas encore publiées')
    expect(w.text()).not.toContain('null')
  })

  it('l en-tête garde la note quand elle est publiée', () => {
    const w = mount(EvalResultScoreHeader, { props: { submission: copie({ note_sur_20: 15, score: 30 }, { show_results: true }) } })
    expect(w.findAll('.score-value').map((n) => n.text())).toEqual(['15/20', '30', '2'])
  })

  it('le statut du corrigé affiche le message de son état', () => {
    const w = mount(EvalResultCorrigeStatut, { props: { submission: copie({}, { correction_release: 'never' }) } })
    expect(w.text()).toContain('Pas de corrigé prévu')
  })

  it('une question non corrigée affiche le message, plus « dans N jour(s) »', () => {
    const q = { id: 2, type: 'reponse_courte', question: 'Expliquez', points: 5 }
    const w = mount(ResultQuestionCard, {
      props: { question: q, index: 1, answers: { 2: 'Ma réponse' }, correctionAvailable: false, messageCorrige: 'Le corrigé ouvrira avec la publication des notes.' },
    })
    expect(w.text()).toContain('Ma réponse')
    expect(w.text()).toContain('avec la publication des notes')
    expect(w.text()).not.toMatch(/jour/)
  })
})

describe('DiffusionEvaluation : l enseignant publie et règle le corrigé', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.releaseEvaluation.mockResolvedValue({ success: true, data: evaluationEnseignant({ show_results: true }) })
  })

  it('publier les notes : confirmation, puis exactement show_results, et la réponse remonte', async () => {
    h.confirm.mockResolvedValue(true)
    const w = mount(DiffusionEvaluation, { props: { evaluation: evaluationEnseignant() } })
    expect(w.text()).toContain('Notes non publiées')

    await w.find('[data-test="publier"]').trigger('click')
    await flushPromises()

    expect(h.confirm).toHaveBeenCalledTimes(1)
    expect(h.releaseEvaluation).toHaveBeenCalledWith(42, { show_results: true })
    expect(w.emitted('maj')[0][0]).toMatchObject({ id: 42, show_results: true })
  })

  it('annulée, la confirmation n envoie rien', async () => {
    h.confirm.mockResolvedValue(false)
    const w = mount(DiffusionEvaluation, { props: { evaluation: evaluationEnseignant() } })

    await w.find('[data-test="publier"]').trigger('click')
    await flushPromises()

    expect(h.releaseEvaluation).not.toHaveBeenCalled()
  })

  it('des notes publiées se retirent', async () => {
    h.confirm.mockResolvedValue(true)
    const w = mount(DiffusionEvaluation, { props: { evaluation: evaluationEnseignant({ show_results: true }) } })
    expect(w.find('[data-test="publier"]').text()).toContain('Retirer la publication')

    await w.find('[data-test="publier"]').trigger('click')
    await flushPromises()

    expect(h.releaseEvaluation).toHaveBeenCalledWith(42, { show_results: false })
  })

  it('le corrigé à la fermeture : le mode seul, sans date', async () => {
    const w = mount(DiffusionEvaluation, { props: { evaluation: evaluationEnseignant() } })

    await w.find('[data-test="mode-corrige"]').setValue('after_close')
    expect(w.find('[data-test="date-corrige"]').exists()).toBe(false)
    await w.find('[data-test="enregistrer"]').trigger('click')
    await flushPromises()

    expect(h.releaseEvaluation).toHaveBeenCalledWith(42, { correction_release: 'after_close' })
  })

  it('le corrigé à une date : la date est demandée, puis envoyée', async () => {
    const w = mount(DiffusionEvaluation, { props: { evaluation: evaluationEnseignant() } })

    await w.find('[data-test="mode-corrige"]').setValue('at_date')
    expect(w.find('[data-test="enregistrer"]').attributes('disabled')).toBeDefined()
    await w.find('[data-test="date-corrige"]').setValue('2026-12-05T08:00')
    await w.find('[data-test="enregistrer"]').trigger('click')
    await flushPromises()

    const [id, corps] = h.releaseEvaluation.mock.calls[0]
    expect(id).toBe(42)
    expect(corps.correction_release).toBe('at_date')
    expect(new Date(corps.correction_release_at).getTime()).toBe(new Date('2026-12-05T08:00').getTime())
    expect(w.text()).toContain('jamais avant la fermeture')
  })

  it('un refus du serveur s annonce, l évaluation affichée ne change pas', async () => {
    h.confirm.mockResolvedValue(true)
    h.releaseEvaluation.mockRejectedValue({ response: { status: 404, data: { message: 'Évaluation introuvable.' } } })
    const w = mount(DiffusionEvaluation, { props: { evaluation: evaluationEnseignant() } })

    await w.find('[data-test="publier"]').trigger('click')
    await flushPromises()

    expect(h.toast.error).toHaveBeenCalledTimes(1)
    expect(w.emitted('maj')).toBeUndefined()
  })
})
