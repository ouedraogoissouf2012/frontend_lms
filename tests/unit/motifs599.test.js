/**
 * #599 : six motifs (`reason`) qu'un écran reçoit n'avaient pas de texte au catalogue ; l'écran disait le message
 * générique du statut (D0), et l'utilisateur ne savait pas pourquoi. Chacun a désormais son texte et sa catégorie,
 * séparée des autres, dans l'esprit de #591. Relevé sur `lms` :
 * - quiz (lms_backend#1075, KnowledgeCheckOpenAttempts) : `attempt_not_open` (409), `quiz_changed_since_start` (409),
 *   `answer_not_an_option_index` (422), à la remise ;
 * - évaluation : `evaluation_attempt_conflict` (409, au démarrage ET à la remise : la copie est déjà remise) et
 *   `evaluation_not_linked_to_klassci` (422, à la synchronisation) ;
 * - `classe_local_only` (409, GET /lms/classes/local/{id} : une classe créée dans le LMS n'a pas de fiche KLASSCI).
 * Ce fichier : le catalogue, le lecteur de quiz et la fiche d'une classe. Les écrans d'évaluation :
 * `motifs599Evaluation.test.js`.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ submit: vi.fn(), toastError: vi.fn(), detailsLocal: vi.fn() }))
vi.mock('@/services/knowledgeCheck', () => ({ default: { startAttempt: vi.fn(), submitAttempt: (...a) => h.submit(...a) } }))
vi.mock('@/composables/useToast', () => ({ toast: { error: h.toastError, success: vi.fn(), info: vi.fn(), warning: vi.fn() } }))
vi.mock('@/services/lms', () => ({
  default: {
    getClasseDetails: vi.fn(), getClasseDetailsLocal: (...a) => h.detailsLocal(...a),
    getClasseEtudiants: vi.fn().mockResolvedValue({ success: true, data: { etudiants: [] } }),
    getUpcomingSeances: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}))
vi.mock('@/services/klassci', () => ({ default: { getMatieres: vi.fn().mockResolvedValue([]) } }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ role: 'coordinateur' }) } }))

import { normalizeError, messageForReason } from '@/services/errorHandler'
import { REASONS, entreeDuMotif } from '@/services/refusalReasons'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useKnowledgeCheckPlayer } from '@/composables/useKnowledgeCheckPlayer'
import { useClasseDetails } from '@/composables/useClasseDetails'

const SERVEUR = 'Texte fictif du serveur, jamais montré'
const refus = (status, reason) => ({ response: { status, data: { success: false, message: SERVEUR, reason }, headers: {} } })

// [motif, statut reçu, texte exact] ; aucun n'est transitoire : réessayer à l'identique n'y change rien.
const MOTIFS_599 = Object.freeze([
  ['attempt_not_open', 409, "Cette tentative n'est plus ouverte : recommencez le quiz."],
  ['quiz_changed_since_start', 409, "Ce quiz a été modifié depuis que vous l'avez commencé : recommencez-le."],
  ['answer_not_an_option_index', 422, 'Une réponse ne correspond à aucune des options proposées : recommencez le quiz.'],
  ['evaluation_attempt_conflict', 409, "Votre copie vient d'être remise depuis une autre fenêtre ou un autre appareil. Rechargez l'évaluation."],
  ['evaluation_not_linked_to_klassci', 422, "Cette évaluation n'est liée à aucune évaluation KLASSCI : ses notes restent dans le LMS."],
  ['classe_local_only', 409, "Cette classe a été créée dans le LMS : elle n'a pas de fiche KLASSCI à afficher."],
])

describe('#599 — le catalogue : chaque motif a son texte', () => {
  it.each(MOTIFS_599)('%s (%i) : le texte exact, définitif, jamais celui du serveur', (reason, status, texte) => {
    expect(messageForReason(reason)).toBe(texte)
    expect(entreeDuMotif(reason)?.transitoire).toBe(false)
    const n = normalizeError(refus(status, reason))
    expect(n.userMessage).toBe(texte)
    expect(n.userMessage).not.toContain(SERVEUR)
  })

  it('six catégories, chacune à un seul motif, et six textes que rien d’autre au catalogue ne dit', () => {
    const categories = MOTIFS_599.map(([reason]) => entreeDuMotif(reason)?.categorie)
    expect(new Set(categories).size).toBe(6)
    for (const categorie of categories) {
      expect(Object.values(REASONS).filter((e) => e.categorie === categorie)).toHaveLength(1)
      expect(Object.values(ERROR_MESSAGES).filter((t) => t === ERROR_MESSAGES[categorie])).toHaveLength(1)
    }
  })

  it.each([409, 422])('un motif inconnu (%i) : toujours le message du statut (verrou D0)', (status) => {
    expect(normalizeError(refus(status, 'motif_pas_encore_traduit'))).toEqual(normalizeError(refus(status, undefined)))
  })
})

describe('#599 — le lecteur de quiz dit le motif d’une remise refusée', () => {
  const quiz = { id: 7, title: 'Quiz fictif', passing_score: 70 }
  beforeEach(() => {
    h.submit.mockReset()
    h.toastError.mockReset()
  })

  it.each(MOTIFS_599.slice(0, 3))('%s (%i) : le texte du catalogue', async (reason, status, texte) => {
    h.submit.mockRejectedValue(refus(status, reason))
    let api
    mount(defineComponent({ setup() { api = useKnowledgeCheckPlayer({ quiz }, vi.fn()); return () => null } }))
    await api.submitQuiz()
    await flushPromises()
    expect(h.toastError).toHaveBeenCalledWith(texte)
  })
})

describe('#599 — la fiche d’une classe créée dans le LMS (porte locale)', () => {
  it('classe_local_only (409) : la page dit pourquoi, pas « conflit »', async () => {
    h.detailsLocal.mockRejectedValue(refus(409, 'classe_local_only'))
    let api
    mount(defineComponent({ setup() { api = useClasseDetails(); return () => null } }), {
      global: { mocks: { $route: { name: 'classe-details-local', params: { id: '2' } }, $router: { push: vi.fn(), back: vi.fn() } } },
    })
    await flushPromises()
    expect(api.error.value).toBe(MOTIFS_599[5][2])
  })
})
