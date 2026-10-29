/**
 * Composable useTeacherEvaluations (#278) — chargement + branches de REPLI, qui
 * n'étaient pas couvertes. On mocke les services (KLASSCI/LMS/cache) et on vérifie
 * le comportement dégradé : KLASSCI en échec bascule sur le dashboard enseignant,
 * un double échec ne casse pas, et l'échec LMS retombe proprement sur [].
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { klassci, evaluation } = vi.hoisted(() => ({
  klassci: {
    getClasses: vi.fn(),
    getMatieres: vi.fn(),
    getEvaluations: vi.fn(),
    getTeacherDashboard: vi.fn(),
  },
  evaluation: { getEvaluations: vi.fn() },
}))

// default (import du composable) ET named `klassciService` (import du helper
// teacherReferentials) — klassci.js exporte les deux vers le même objet.
vi.mock('@/services/klassci', () => ({ default: klassci, klassciService: klassci }))
vi.mock('@/services/evaluation', () => ({ default: evaluation }))
vi.mock('@/services/cache', () => ({ readCache: vi.fn(() => null), writeCache: vi.fn() }))

import { useTeacherEvaluations } from '@/composables/useTeacherEvaluations'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

beforeEach(() => {
  vi.clearAllMocks()
  klassci.getClasses.mockResolvedValue([])
  klassci.getMatieres.mockResolvedValue([])
  klassci.getEvaluations.mockResolvedValue({ success: true, data: [] })
  evaluation.getEvaluations.mockResolvedValue({ success: true, data: [] })
})

describe('useTeacherEvaluations (#278) — chargement & replis', () => {
  it('KLASSCI OK → peuple evaluationsKlassci', async () => {
    klassci.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 1 }, { id: 2 }] })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsKlassci()
    expect(c.evaluationsKlassci.value).toEqual([{ id: 1 }, { id: 2 }])
    expect(klassci.getTeacherDashboard).not.toHaveBeenCalled()
  })

  it('KLASSCI échoue → REPLI sur le dashboard enseignant', async () => {
    klassci.getEvaluations.mockRejectedValue(new Error('403 par classe'))
    klassci.getTeacherDashboard.mockResolvedValue({ evaluations: [{ id: 9 }] })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsKlassci()
    expect(klassci.getTeacherDashboard).toHaveBeenCalled()
    expect(c.evaluationsKlassci.value).toEqual([{ id: 9 }])
  })

  // #420 : un double échec n'est plus rendu comme une liste vide. L'échec
  // remonte à loadData, qui le dit (voir le bloc #420 ci-dessous).
  it('KLASSCI ET dashboard échouent → reste vide, et l échec remonte', async () => {
    klassci.getEvaluations.mockRejectedValue(new Error('403'))
    klassci.getTeacherDashboard.mockRejectedValue(new Error('500'))
    const c = useTeacherEvaluations()
    await expect(c.loadEvaluationsKlassci()).rejects.toThrow('403')
    expect(c.evaluationsKlassci.value).toEqual([])
  })

  it('échec LMS → evaluationsLMS retombe sur [] (dégradation propre)', async () => {
    evaluation.getEvaluations.mockRejectedValue(new Error('réseau'))
    const c = useTeacherEvaluations()
    await c.loadEvaluationsLMS()
    expect(c.evaluationsLMS.value).toEqual([])
  })

  it('LMS OK → mappe questions_count / submissions_count', async () => {
    evaluation.getEvaluations.mockResolvedValue({
      success: true,
      data: [{ id: 3, questions: [{}, {}], submissions: [{}] }],
    })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsLMS()
    expect(c.evaluationsLMS.value[0]).toMatchObject({ id: 3, questions_count: 2, submissions_count: 1 })
  })

  it('loadData orchestre le tout et repose loading à false', async () => {
    klassci.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 1 }] })
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(c.loading.value).toBe(false)
    expect(c.evaluationsKlassci.value).toHaveLength(1)
    expect(c.error.value).toBeNull()
  })
})

/**
 * Le compteur de copies vient du SERVEUR, pas de la longueur d'une relation.
 *
 * Le composable écrasait `submissions_count` par `e.submissions?.length || 0`,
 * c'est-à-dire par la longueur d'un tableau que le backend n'a aucune raison
 * d'envoyer — et qu'il va cesser d'envoyer, parce qu'il contenait les copies de
 * TOUS les élèves de l'établissement : réponses, score et note.
 *
 * Tant que ce repli est en place, retirer la relation côté serveur ferait
 * tomber le compteur à 0 et supprimerait le bouton « Voir les notes » des
 * enseignants (`EvaluationCardActions.vue:22`).
 */
describe('useTeacherEvaluations — le compteur de copies est celui du serveur', () => {
  it('le compteur du serveur est utilisé quand la relation est absente', async () => {
    evaluation.getEvaluations.mockResolvedValue({
      success: true,
      data: [{ id: 7, questions_count: 4, submissions_count: 3 }],
    })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsLMS()
    expect(c.evaluationsLMS.value[0]).toMatchObject({
      id: 7,
      questions_count: 4,
      submissions_count: 3,
    })
  })

  it('le compteur du serveur prime sur la longueur de la relation', async () => {
    // Le cas qui discrimine vraiment : si la relation servait encore de source,
    // on lirait 1 au lieu de 3. Un repli suffirait à passer le test précédent.
    evaluation.getEvaluations.mockResolvedValue({
      success: true,
      data: [{ id: 8, submissions_count: 3, submissions: [{}] }],
    })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsLMS()
    expect(c.evaluationsLMS.value[0].submissions_count).toBe(3)
  })

  it('un zéro MESURÉ par le serveur reste zéro', async () => {
    // `??` et non `||` : un 0 venant du serveur est une mesure, pas une absence.
    // Le confondre avec « non renseigné » ferait repartir vers la relation.
    evaluation.getEvaluations.mockResolvedValue({
      success: true,
      data: [{ id: 9, submissions_count: 0, submissions: [{}, {}] }],
    })
    const c = useTeacherEvaluations()
    await c.loadEvaluationsLMS()
    expect(c.evaluationsLMS.value[0].submissions_count).toBe(0)
  })
})

/**
 * #420 — « aucune évaluation » et « je n'ai pas pu charger » ne se confondent plus.
 *
 * Un compte sans accès KLASSCI (`klassci_token_missing`) reçoit une MENTION vraie,
 * pas l'état d'erreur, et sans repli vers le dashboard (même cause, même refus).
 * Toute autre panne, repli compris, renseigne `error`.
 */
describe('#420 — accès KLASSCI absent et panne réelle', () => {
  // Source unique : le message du catalogue (aucune copie locale du texte).
  const MENTION = ERROR_MESSAGES.klassciTokenMissing
  const http = (status, data = {}, headers = {}) =>
    Object.assign(new Error(`HTTP ${status}`), {
      isAxiosError: true,
      response: { status, data: { success: false, ...data }, headers },
    })
  const jetonAbsent = () => http(401, { reason: 'klassci_token_missing', message: 'KLASSCI' })
  const klassciEnPanne = () => http(503, { message: 'KLASSCI' }, { 'retry-after': '30' })

  it('jeton absent → mention vraie, aucun repli vers le dashboard, aucune erreur', async () => {
    klassci.getEvaluations.mockRejectedValue(jetonAbsent())
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(klassci.getTeacherDashboard).not.toHaveBeenCalled()
    expect(c.evaluationsKlassci.value).toEqual([])
    expect(c.mentionSource.value).toBe(MENTION)
    expect(c.error.value).toBeNull()
  })

  it('jeton absent constaté par le repli → mention vraie, aucune erreur', async () => {
    klassci.getEvaluations.mockRejectedValue(new Error('403 par classe'))
    klassci.getTeacherDashboard.mockRejectedValue(jetonAbsent())
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(c.mentionSource.value).toBe(MENTION)
    expect(c.error.value).toBeNull()
  })

  it('panne KLASSCI et repli en échec → error dit la panne, au message du catalogue', async () => {
    klassci.getEvaluations.mockRejectedValue(klassciEnPanne())
    klassci.getTeacherDashboard.mockRejectedValue(klassciEnPanne())
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(c.error.value).toBe(ERROR_MESSAGES.klassciUnavailable)
    expect(c.mentionSource.value).toBe('')
    expect(c.loading.value).toBe(false)
  })

  it('repli sans évaluations exploitables (réponse refusée) → error, pas une liste vide', async () => {
    klassci.getEvaluations.mockRejectedValue(klassciEnPanne())
    klassci.getTeacherDashboard.mockResolvedValue(null)
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(c.error.value).toBe(ERROR_MESSAGES.klassciUnavailable)
  })

  it('un repli qui répond une liste vide reste « aucune évaluation »', async () => {
    klassci.getEvaluations.mockRejectedValue(new Error('403 par classe'))
    klassci.getTeacherDashboard.mockResolvedValue({ evaluations: [] })
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(c.error.value).toBeNull()
    expect(c.mentionSource.value).toBe('')
  })

  it('un rechargement retire la mention AVANT tout await, pas à la réponse', async () => {
    klassci.getEvaluations.mockRejectedValueOnce(jetonAbsent())
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(c.mentionSource.value).toBe(MENTION)
    let libererClasses
    klassci.getClasses.mockReturnValueOnce(new Promise((r) => { libererClasses = r }))
    const enCours = c.loadData()
    expect(c.mentionSource.value).toBe('')
    libererClasses([])
    await enCours
  })

  it('un rechargement réussi retire la mention', async () => {
    klassci.getEvaluations.mockRejectedValueOnce(jetonAbsent())
    const c = useTeacherEvaluations()
    await c.loadData()
    expect(c.mentionSource.value).toBe(MENTION)
    klassci.getEvaluations.mockResolvedValue({ success: true, data: [{ id: 1 }] })
    await c.loadData()
    expect(c.mentionSource.value).toBe('')
    expect(c.evaluationsKlassci.value).toEqual([{ id: 1 }])
  })
})
