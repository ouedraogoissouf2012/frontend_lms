/**
 * Module d'assertions de contrat — agnostique du runner (#17 — api-contract-sync).
 *
 * Vérifie, pour chaque méthode de service couverte par la spec (R1–R12, R15),
 * la MÉTHODE HTTP et le CHEMIN exacts émis, plus :
 *   - des assertions NÉGATIVES (chemins morts interdits) ;
 *   - des vérifications STRUCTURELLES (méthodes de code mort supprimées) ;
 *   - le garde-fou anti-IDOR (R7.5 / R13.5).
 *
 * La logique est partagée par le runner natif (`run-contract.mjs`) et l'entrée
 * Vitest (`api-contract.test.mjs`) afin de n'avoir qu'une seule source de vérité.
 *
 * Chaque cible est confirmée par `.claude/specs/api-contract-sync/backend-contract-verified.md`.
 */
import { setActivePinia, createPinia } from 'pinia'
import { installCapture } from './captureAdapter.mjs'

// Services réels (import = le vrai code testé, pas un double).
import { quizzes, notifications as apiNotifications } from '../../src/services/api.js'
import evaluationService from '../../src/services/evaluation.js'
import chapterService from '../../src/services/chapter.js'
import lmsService from '../../src/services/lms.js'
import klassciService from '../../src/services/klassci.js'
import chapterProgressService from '../../src/services/chapterProgress.js'
import { notificationsService } from '../../src/services/notifications.js'
import { searchService } from '../../src/services/search.js'

/** Motif IDOR : un identifiant d'étudiant dans le chemin est interdit (R7.5). */
const IDOR_PATTERN = /^\/evaluations\/student\/.+/

/**
 * Cas de contrat positifs : chaque cas exécute une méthode de service et asserte
 * la requête capturée. `body` (optionnel) vérifie le corps émis.
 * `_req` = requirement tracé, `_ek` = écart tracé.
 */
export const contractCases = [
  {
    name: 'R1 — quizzes.startAttempt → POST /quizzes/{id}/start',
    _req: 'R1', _ek: 'Ék-1',
    run: () => quizzes.startAttempt(42),
    method: 'POST', url: '/quizzes/42/start',
  },
  {
    name: 'R2 — quizzes.submitAttempt → POST /quiz-attempts/{id}/submit (corps { answers })',
    _req: 'R2', _ek: 'Ék-2',
    run: () => quizzes.submitAttempt(7, [{ question_id: 1, answer: 'a' }]),
    method: 'POST', url: '/quiz-attempts/7/submit',
    body: (d) => d && Array.isArray(d.answers),
  },
  {
    name: 'R8 — evaluation.syncToKlassci → POST /evaluations/{id}/sync-klassci (sans corps)',
    _req: 'R8', _ek: 'Ék-7',
    run: () => evaluationService.syncToKlassci(9),
    method: 'POST', url: '/evaluations/9/sync-klassci',
  },
  {
    name: 'R12 — lms.getVisioParticipants → GET /lms/seances/{id}/visio-participants',
    _req: 'R12', _ek: 'Ék-11',
    run: () => lmsService.getVisioParticipants(5),
    method: 'GET', url: '/lms/seances/5/visio-participants',
  },
  {
    name: 'R12.2 — lms.getSeanceParticipants → GET /lms/seances/{id}/participants (INCHANGÉ)',
    _req: 'R12.2', _ek: 'Ék-11',
    run: () => lmsService.getSeanceParticipants(5),
    method: 'GET', url: '/lms/seances/5/participants',
  },
  {
    name: 'R9 — chapter.createChapter(lessonId, data) → POST /lessons/{lessonId}/chapters',
    _req: 'R9', _ek: 'Ék-8',
    run: () => chapterService.createChapter(3, { titre: 'x', ordre: 0 }),
    method: 'POST', url: '/lessons/3/chapters',
  },
  {
    name: 'R9.1 — chapter.getChapters(lessonId) → GET /lessons/{lessonId}/chapters',
    _req: 'R9.1', _ek: '#30',
    run: () => chapterService.getChapters(3),
    method: 'GET', url: '/lessons/3/chapters',
  },
  {
    name: 'R10 — chapter.reorderChapters(lessonId, chapters) → POST /lessons/{lessonId}/chapters/reorder',
    _req: 'R10', _ek: 'Ék-9',
    run: () => chapterService.reorderChapters(3, [{ id: 1, order: 0 }]),
    method: 'POST', url: '/lessons/3/chapters/reorder',
    body: (d) => d && Array.isArray(d.chapters),
  },
  {
    name: 'R4 — notificationsService.markAsRead → POST /notifications/{id}/mark-as-read',
    _req: 'R4', _ek: 'Ék-4',
    run: () => notificationsService.markAsRead(1),
    method: 'POST', url: '/notifications/1/mark-as-read',
  },
  {
    name: 'R5 — notificationsService.markAllAsRead → POST /notifications/mark-all-as-read',
    _req: 'R5', _ek: 'Ék-5',
    run: () => notificationsService.markAllAsRead(),
    method: 'POST', url: '/notifications/mark-all-as-read',
  },
  {
    name: 'R11 — searchService.globalSearch → GET /search',
    _req: 'R11', _ek: 'Ék-10',
    run: () => searchService.globalSearch('x'),
    method: 'GET', url: '/search',
  },
  {
    name: 'R7 — evaluation.getStudentEvaluations() → GET /evaluations/student (sans id)',
    _req: 'R7', _ek: 'Ék-6',
    run: () => evaluationService.getStudentEvaluations(),
    method: 'GET', url: '/evaluations/student',
  },
]

/**
 * Vérifications structurelles : le code mort doit être SUPPRIMÉ (R3, R11, R15, R14.3).
 * Chaque entrée : { name, ok: () => boolean }.
 */
export const structuralChecks = [
  {
    name: 'R3 — quizzes.getMyAttempts supprimée (code mort)',
    _req: 'R3', _ek: 'Ék-3',
    ok: () => typeof quizzes.getMyAttempts === 'undefined',
  },
  {
    name: 'R11 — klassciService.search supprimée (route /proxy/search inexistante)',
    _req: 'R11', _ek: 'Ék-10',
    ok: () => typeof klassciService.search === 'undefined',
  },
  {
    name: 'R15 — chapterProgressService.resetLessonProgress supprimée (route inexistante)',
    _req: 'R15', _ek: 'Ék-12',
    ok: () => typeof chapterProgressService.resetLessonProgress === 'undefined',
  },
  {
    name: 'R6 — api.js notifications.markAsRead supprimée (dédup, client canonique = notifications.js)',
    _req: 'R6', _ek: 'Ék-4',
    ok: () => typeof apiNotifications.markAsRead === 'undefined',
  },
  {
    name: 'R6 — api.js notifications.markAllAsRead supprimée (dédup)',
    _req: 'R6', _ek: 'Ék-5',
    ok: () => typeof apiNotifications.markAllAsRead === 'undefined',
  },
]

/**
 * Cas « edge » : validation synchrone du lessonId (R9.3 / R10.2).
 * La méthode DOIT lever avant tout appel réseau si lessonId est falsy.
 */
export const edgeCases = [
  {
    name: 'R9.3 — createChapter(null, data) lève sans requête',
    _req: 'R9.3', _ek: 'Ék-8',
    run: () => chapterService.createChapter(null, { titre: 'x' }),
    mustThrow: true,
  },
  {
    name: 'R9.4 — getChapters(null) lève sans requête',
    _req: 'R9.4', _ek: '#30',
    run: () => chapterService.getChapters(null),
    mustThrow: true,
  },
  {
    name: 'R10.2 — reorderChapters(undefined, list) lève sans requête',
    _req: 'R10.2', _ek: 'Ék-9',
    run: () => chapterService.reorderChapters(undefined, [{ id: 1, order: 0 }]),
    mustThrow: true,
  },
]

/** Chemins morts qui ne doivent JAMAIS être émis (assertions négatives). */
const DEAD_PATH_MATCHERS = [
  { label: '/quizzes/{id}/attempts', test: (u) => /^\/quizzes\/\d+\/attempts$/.test(u) },
  { label: '/quizzes/attempts/{id}/submit', test: (u) => /^\/quizzes\/attempts\//.test(u) },
  { label: '/quizzes/{id}/my-attempts', test: (u) => /^\/quizzes\/\d+\/my-attempts$/.test(u) },
  { label: '/notifications/{id}/read', test: (u) => /^\/notifications\/\d+\/read$/.test(u) },
  { label: '/notifications/read-all', test: (u) => u === '/notifications/read-all' },
  { label: '/evaluations/{id}/sync-to-klassci', test: (u) => /\/sync-to-klassci$/.test(u) },
  { label: '/proxy/search', test: (u) => u === '/proxy/search' },
  { label: '/chapters (sans segment leçon)', test: (u) => u === '/chapters' || u.startsWith('/chapters?') },
  { label: '/chapters/reorder (sans segment leçon)', test: (u) => u === '/chapters/reorder' },
]

/**
 * Exécute toutes les assertions de contrat.
 * @returns {Promise<{results: Array<{name, ok, detail, _req, _ek}>, failed: number}>}
 */
export async function runContractAssertions() {
  // Pinia actif requis : l'intercepteur axios lit le token via useAuthStore() (#19).
  // Store vide ici → aucun header Authorization → les assertions de chemin sont intactes.
  setActivePinia(createPinia())
  const capture = installCapture()
  const results = []

  // 1. Cas positifs : méthode + chemin (+ corps).
  for (const c of contractCases) {
    capture.reset()
    try {
      await c.run()
      const last = capture.last()
      if (!last) {
        results.push({ ...meta(c), ok: false, detail: 'aucune requête capturée' })
        continue
      }
      const methodOk = last.method === c.method
      const urlOk = last.url === c.url
      const bodyOk = c.body ? c.body(last.data) : true
      const ok = methodOk && urlOk && bodyOk
      results.push({
        ...meta(c),
        ok,
        detail: ok ? `${last.method} ${last.url}` :
          `attendu ${c.method} ${c.url}${c.body ? ' + corps conforme' : ''}, reçu ${last.method} ${last.url}` +
          (c.body && !bodyOk ? ` (corps non conforme: ${JSON.stringify(last.data)})` : ''),
      })
    } catch (err) {
      results.push({ ...meta(c), ok: false, detail: `exception: ${err.message}` })
    }
  }

  // 2. Garde-fou anti-IDOR : même un argument forgé ne doit pas produire un chemin paramétré.
  capture.reset()
  try {
    await evaluationService.getStudentEvaluations('999')
    const last = capture.last()
    const urlSafe = last && !IDOR_PATTERN.test(last.url)
    const paramSafe = !last?.params || !('klassciEtudiantId' in (last.params || {}))
    const ok = Boolean(urlSafe && paramSafe)
    results.push({
      name: 'R7.5 — garde-fou IDOR : getStudentEvaluations("999") ne forge pas /evaluations/student/999',
      _req: 'R7.5', _ek: 'Ék-6',
      ok,
      detail: ok ? `sûr (${last?.url})` : `RÉGRESSION IDOR : ${last?.url} / params=${JSON.stringify(last?.params)}`,
    })
  } catch (err) {
    results.push({
      name: 'R7.5 — garde-fou IDOR',
      _req: 'R7.5', _ek: 'Ék-6', ok: false, detail: `exception: ${err.message}`,
    })
  }

  // 3. Assertions négatives globales : aucun chemin mort parmi TOUTES les requêtes capturées.
  //    On rejoue tous les cas positifs en accumulant (sans reset) pour balayer l'ensemble.
  capture.reset()
  for (const c of contractCases) {
    try { await c.run() } catch { /* ignoré ici : couvert par les cas positifs */ }
  }
  for (const matcher of DEAD_PATH_MATCHERS) {
    const hit = capture.calls.find((call) => matcher.test(call.url))
    results.push({
      name: `Négatif — aucun appel vers ${matcher.label}`,
      _req: 'R14.3', _ek: '—',
      ok: !hit,
      detail: hit ? `chemin mort émis: ${hit.method} ${hit.url}` : 'absent',
    })
  }

  // 4. Vérifications structurelles (code mort supprimé).
  for (const s of structuralChecks) {
    let ok = false
    try { ok = Boolean(s.ok()) } catch (err) { ok = false }
    results.push({ ...meta(s), ok, detail: ok ? 'supprimée' : 'ENCORE PRÉSENTE' })
  }

  // 5. Cas edge : validation synchrone (doit lever sans requête réseau).
  for (const e of edgeCases) {
    capture.reset()
    let threw = false
    try { await e.run() } catch { threw = true }
    const noRequest = capture.calls.length === 0
    const ok = threw && noRequest
    results.push({
      ...meta(e),
      ok,
      detail: ok ? 'lève sans requête' :
        `attendu une exception sans requête (a levé: ${threw}, requêtes: ${capture.calls.length})`,
    })
  }

  const failed = results.filter((r) => !r.ok).length
  return { results, failed }
}

function meta(c) {
  return { name: c.name, _req: c._req, _ek: c._ek }
}
