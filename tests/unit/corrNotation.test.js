/**
 * Lot CORR : l'enseignant corrige une copie à l'écran (ARRÊT 1 validé). Contrat (#1031/#1037, spec à 685695df) :
 * - `POST /evaluations/{id}/submissions/{submission}/grade`, `{ points: { "<question_id>": n ≥ 0 }, feedback? }` ;
 *   seules les DISSERTATIONS reçoivent des points, chacune doit en recevoir ; la copie passe `corrige` ;
 * - refus : 403 (rôle, non-propriétaire), 409 sans `reason` (copie `en_cours`), 409
 *   `evaluation_attempt_locked` (hors délai), 422 (points) ;
 * - `GET results-by-class` rend déjà `data.evaluation` ENRICHIE : ses questions et toutes ses copies
 *   (`answers`, `manual_points`), entraînements compris (`feedback` « [PRACTICE] … »).
 * Règle du bouton = la règle serveur, ni plus large ni plus étroite (lms_backend 685695df) :
 * - route : `role:enseignant,coordinateur,admin` (routes/api/evaluation.php:47) ;
 * - `ChecksEvaluationOwnership::checkEvaluationOwnership` (:72-86) : coordinateur refusé ;
 * - `mayActOnRoutedEvaluation` (:141-164) : admin ; sinon auteur local (`enseignant_id === user.id`) ;
 *   sinon identité KLASSCI (`klassci_enseignant_id`), que le front NE REÇOIT PAS : ce cas (ligne
 *   d'avant D72, sans `enseignant_id`) est délégué au serveur, son 403 traduit (déclaré).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const h = vi.hoisted(() => ({ grade: vi.fn(), sync: vi.fn(), toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }))
vi.mock('@/services/evaluation', () => ({
  default: { gradeSubmission: (...a) => h.grade(...a), syncToKlassci: (...a) => h.sync(...a) },
}))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: () => Promise.resolve(true) }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import {
  copiesDeLEvaluation, aCorriger, peutNoter, questionsANoter, validerPoints,
} from '@/utils/correctionCopies'
import { useNotationCopie } from '@/composables/useNotationCopie'
import CorrectionCopiesPanel from '@/components/evaluations/CorrectionCopiesPanel.vue'
import { useTeacherEvaluationActions } from '@/composables/useTeacherEvaluationActions'

const PIEGE = 'SQLSTATE piège serveur'
const EVAL = {
  id: 42, enseignant_id: 9, klassci_enseignant_id: null, titre: 'Dissert',
  questions: [
    { id: 13, type: 'qcm', question: 'Capitale ?', points: 2 },
    { id: 14, type: 'dissertation', question: 'Commentez.', points: 6 },
  ],
  submissions: [
    { id: 70, student_id: 31, attempt: 1, status: 'soumis', answers: { 13: 'Paris', 14: 'Mon texte' }, manual_points: null, score: '2.00', feedback: null },
    { id: 71, student_id: 32, attempt: 1, status: 'verrouille', answers: { 14: 'Tard' }, manual_points: null, score: null, feedback: null },
    { id: 72, student_id: 31, attempt: 2, status: 'soumis', answers: {}, manual_points: null, score: null, feedback: '[PRACTICE] entraînement' },
  ],
}
const RESULTATS = [{ etudiant_id: 31, etudiant_nom_complet: 'Awa K.' }, { etudiant_id: 32, etudiant_nom_complet: 'Ben T.' }]
const PROF = { id: 9, role: 'enseignant' }

beforeEach(() => { vi.clearAllMocks() })

describe('utils/correctionCopies — la règle de lecture et la règle serveur du bouton', () => {
  it('1. copies : entraînements exclus, élève nommé par student_id (sinon « — »)', () => {
    const copies = copiesDeLEvaluation(EVAL, RESULTATS)
    expect(copies.map((c) => c.id)).toEqual([70, 71])
    expect(copies.map((c) => c.nom)).toEqual(['Awa K.', 'Ben T.'])
    expect(copiesDeLEvaluation({ ...EVAL, submissions: [EVAL.submissions[0]] }, [])[0].nom).toBe('—')
  })

  it('2. à corriger = copie soumise d’une évaluation à dissertation ; ni corrigée, ni hors délai', () => {
    expect(questionsANoter(EVAL).map((q) => q.id)).toEqual([14])
    expect(aCorriger(EVAL.submissions[0], EVAL)).toBe(true)
    expect(aCorriger({ status: 'corrige' }, EVAL)).toBe(false)
    expect(aCorriger(EVAL.submissions[1], EVAL)).toBe(false)
    expect(aCorriger(EVAL.submissions[0], { ...EVAL, questions: [EVAL.questions[0]] })).toBe(false)
  })

  it('3. bouton = règle serveur : coordinateur jamais, admin toujours, enseignant auteur seulement', () => {
    expect(peutNoter({ id: 1, role: 'coordinateur' }, EVAL)).toBe(false)
    expect(peutNoter({ id: 1, role: 'admin' }, EVAL)).toBe(true)
    expect(peutNoter(PROF, EVAL)).toBe(true)
    expect(peutNoter({ id: 8, role: 'enseignant' }, EVAL)).toBe(false)
    expect(peutNoter({ id: 1, role: 'etudiant' }, EVAL)).toBe(false)
  })

  it('4. ligne d’avant D72 (sans enseignant_id, identité KLASSCI) : délégué au serveur (déclaré)', () => {
    expect(peutNoter({ id: 8, role: 'enseignant' }, { ...EVAL, enseignant_id: null, klassci_enseignant_id: 5 })).toBe(true)
    expect(peutNoter({ id: 8, role: 'enseignant' }, { ...EVAL, enseignant_id: null, klassci_enseignant_id: null })).toBe(false)
  })

  it('5. points : chaque dissertation entre 0 et ses points ; sinon une erreur par question', () => {
    const q = questionsANoter(EVAL)
    expect(validerPoints({ 14: 4 }, q)).toEqual({})
    expect(Object.keys(validerPoints({}, q))).toEqual(['14'])
    expect(Object.keys(validerPoints({ 14: -1 }, q))).toEqual(['14'])
    expect(Object.keys(validerPoints({ 14: 7 }, q))).toEqual(['14'])
    expect(Object.keys(validerPoints({ 14: 'abc' }, q))).toEqual(['14'])
  })
})

async function notation() {
  const onNotee = vi.fn()
  let api
  mount(defineComponent({ setup() { api = useNotationCopie({ evaluation: ref(EVAL), onNotee }); return () => null } }))
  api.ouvrir(EVAL.submissions[0])
  api.points[14] = 4
  return { api, onNotee }
}

describe('useNotationCopie — noter, et dire chaque refus par le catalogue (D0)', () => {
  it('6. succès : POST grade (id LMS, copie, points numériques, commentaire), panneau fermé, liste relue', async () => {
    h.grade.mockResolvedValue({ success: true, data: { id: 70, status: 'corrige' } })
    const { api, onNotee } = await notation()
    api.feedback.value = 'Bien argumenté'
    await api.noter()
    expect(h.grade).toHaveBeenCalledWith(42, 70, { points: { 14: 4 }, feedback: 'Bien argumenté' })
    expect(api.copie.value).toBeNull()
    expect(onNotee).toHaveBeenCalledTimes(1)
  })

  it('7. points invalides : aucun envoi, l’erreur est sur la question', async () => {
    const { api } = await notation()
    api.points[14] = 9
    await api.noter()
    expect(h.grade).not.toHaveBeenCalled()
    expect(api.erreurs.value[14]).toEqual(expect.any(String))
  })

  const refus = (status, data) => ({ response: { status, data: { success: false, message: PIEGE, ...data } } })

  it('8. 409 evaluation_attempt_locked → message du catalogue, sans Réessayer', async () => {
    h.grade.mockRejectedValue(refus(409, { reason: 'evaluation_attempt_locked' }))
    const { api } = await notation()
    await api.noter()
    expect(api.erreur.value).toBe(ERROR_MESSAGES.evaluationAttemptLocked)
    expect(api.canRetry.value).toBe(false)
  })

  it('9. 409 sans reason → copie encore en cours ; 403 → non autorisé ; jamais le texte serveur', async () => {
    h.grade.mockRejectedValue(refus(409, {}))
    const a = await notation()
    await a.api.noter()
    expect(a.api.erreur.value).toBe('Cette copie est encore en cours : elle ne peut pas être notée.')
    h.grade.mockRejectedValue(refus(403, {}))
    const b = await notation()
    await b.api.noter()
    expect(b.api.erreur.value).toBe('Vous ne pouvez pas noter cette copie.')
    expect(`${a.api.erreur.value}${b.api.erreur.value}`).not.toContain('SQLSTATE')
  })

  it('10. 422 sur points.14 → l’erreur est rattachée à la question ; panne 5xx → Réessayer', async () => {
    h.grade.mockRejectedValue({ response: { status: 422, data: { message: PIEGE, errors: { 'points.14': [PIEGE] } } } })
    const a = await notation()
    await a.api.noter()
    expect(a.api.erreurs.value[14]).toEqual(expect.any(String))
    expect(a.api.erreurs.value[14]).not.toContain('SQLSTATE')
    h.grade.mockRejectedValue({ response: { status: 503, data: {} } })
    const b = await notation()
    await b.api.noter()
    expect(b.api.canRetry.value).toBe(true)
  })

  it('11. un envoi à la fois', async () => {
    let fin
    h.grade.mockImplementation(() => new Promise((r) => { fin = r }))
    const { api } = await notation()
    const premier = api.noter()
    await api.noter()
    expect(h.grade).toHaveBeenCalledTimes(1)
    fin({ success: true })
    await premier
  })
})

describe('CorrectionCopiesPanel — l’écran', () => {
  const monter = (user) => mount(CorrectionCopiesPanel, { props: { evaluation: EVAL, resultats: RESULTATS, user } })

  it('12. l’auteur voit « Noter » sur la copie à corriger, jamais sur la copie hors délai ; le coordinateur jamais', () => {
    const prof = monter(PROF)
    expect(prof.findAll('[data-test="noter"]')).toHaveLength(1)
    expect(prof.text()).toContain('À corriger')
    expect(prof.text()).toContain('Hors délai')
    expect(monter({ id: 1, role: 'coordinateur' }).findAll('[data-test="noter"]')).toHaveLength(0)
  })

  it('13. ouvrir une copie : la réponse de la dissertation et un champ de points borné à ses points', async () => {
    const w = monter(PROF)
    await w.find('[data-test="noter"]').trigger('click')
    expect(w.text()).toContain('Mon texte')
    const champ = w.find('input[name="points-14"]')
    expect(champ.exists()).toBe(true)
    expect(champ.attributes('max')).toBe('6')
    expect(champ.attributes('min')).toBe('0')
  })
})

describe('synchronisation KLASSCI — le 409 « dissertation non notée » dit sa cause (ii)', () => {
  it('14. 409 de sync-klassci → message du catalogue, jamais le texte serveur', async () => {
    h.sync.mockRejectedValue({ response: { status: 409, data: { success: false, message: PIEGE } } })
    let api
    mount(defineComponent({ setup() { api = useTeacherEvaluationActions({ evaluationsLMS: ref([]), loadEvaluationsLMS: vi.fn() }); return () => null } }))
    await api.syncToKlassci({ id: 1, online_version: { id: 5, submissions_count: 2 } })
    expect(h.toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.syncDissertationNonNotee)
    expect(h.toast.error).not.toHaveBeenCalledWith(expect.stringContaining('SQLSTATE'))
  })
})
