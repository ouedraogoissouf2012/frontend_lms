/**
 * Tests de la carte unique des endpoints (#105, E1).
 *
 * NB nommage : la config Vitest (`vitest.config.js`) ne collecte que
 * `tests/**\/*.test.{js,mjs}`. L'issue mentionne `Endpoints.spec.js`, mais un
 * `.spec.js` ne serait JAMAIS exécuté → fichier nommé `Endpoints.test.js`
 * pour qu'il tourne réellement sous `npm test` (convention du dépôt).
 *
 * Objectifs :
 *  1. Chaque chemin résout EXACTEMENT à sa valeur attendue (fonctions incluses).
 *  2. La frontière #26 est préservée STRUCTURELLEMENT :
 *     - tout `endpoints.klassci.*` est sous `/proxy/*`,
 *     - tout `endpoints.lms.*`     est sous `/lms/*`,
 *     - aucun croisement.
 *  3. Couverture : tous les chemins en dur d'api.js/klassci.js/lms*.js recensés.
 */
import { describe, it, expect } from 'vitest'
import endpoints from '@/services/endpoints'

/**
 * Aplatit le registre en paires [chemin-pointé, valeur résolue], en appelant
 * chaque fonction paramétrée avec un id sentinelle pour obtenir le chemin final.
 */
const ID = ':id'
function flatten(node, prefix = '') {
  const out = []
  for (const [key, val] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof val === 'function') out.push([path, val(ID)])
    else if (typeof val === 'string') out.push([path, val])
    else out.push(...flatten(val, path))
  }
  return out
}

describe('endpoints — carte unique (#105)', () => {
  describe('frontière BRUT /proxy vs ENRICHI /lms (#26)', () => {
    it('tout endpoints.klassci.* est sous /proxy/', () => {
      for (const [path, url] of flatten(endpoints.klassci, 'klassci')) {
        expect(url.startsWith('/proxy/'), `${path} → ${url}`).toBe(true)
      }
    })

    it('tout endpoints.lms.* est sous /lms/', () => {
      for (const [path, url] of flatten(endpoints.lms, 'lms')) {
        expect(url.startsWith('/lms/'), `${path} → ${url}`).toBe(true)
      }
    })

    it('aucun chemin /proxy/ ne fuit hors de endpoints.klassci', () => {
      for (const group of ['lms', 'admin', 'lessons', 'quizzes', 'dashboard', 'forum', 'teacher', 'evaluations']) {
        for (const [path, url] of flatten(endpoints[group], group)) {
          expect(url.startsWith('/proxy/'), `${path} → ${url}`).toBe(false)
        }
      }
    })
  })

  describe('valeurs exactes — KLASSCI brut (/proxy/*)', () => {
    const k = endpoints.klassci
    it('chemins statiques', () => {
      expect(k.classes).toBe('/proxy/classes')
      expect(k.matieres).toBe('/proxy/matieres')
      expect(k.enseignants).toBe('/proxy/enseignants')
      expect(k.emploiTemps).toBe('/proxy/emploi-temps')
      expect(k.structure).toBe('/proxy/structure')
      expect(k.evaluations).toBe('/proxy/evaluations')
      expect(k.studentDashboard).toBe('/proxy/me/dashboard')
      expect(k.teacherDashboard).toBe('/proxy/me/teacher-dashboard')
    })
    it('chemins paramétrés', () => {
      expect(k.classeDetails(7)).toBe('/proxy/classes/7')
      expect(k.classeEtudiants(7)).toBe('/proxy/classes/7/etudiants')
    })
  })

  describe('valeurs exactes — LMS enrichi (/lms/*)', () => {
    const l = endpoints.lms
    it('enseignants / classes / matieres', () => {
      expect(l.enseignants).toBe('/lms/enseignants')
      expect(l.classes.details(3)).toBe('/lms/classes/3')
      expect(l.classes.etudiants(3)).toBe('/lms/classes/3/etudiants')
      expect(l.matieres.details(9)).toBe('/lms/matieres/9')
      expect(l.matieres.myTeacher).toBe('/lms/teacher/my-matieres')
    })
    it('seances', () => {
      expect(l.seances.upcoming).toBe('/lms/seances/upcoming')
      expect(l.seances.history).toBe('/lms/seances/history')
      expect(l.seances.myTeaching).toBe('/lms/seances/my-teaching')
      expect(l.seances.myClasses).toBe('/lms/seances/my-classes')
      expect(l.seances.details(5)).toBe('/lms/seances/5/details')
      expect(l.seances.participants(5)).toBe('/lms/seances/5/participants')
      expect(l.seances.attendances(5)).toBe('/lms/seances/5/attendances')
      expect(l.seances.validateParticipant(5)).toBe('/lms/seances/5/validate-participant')
      expect(l.seances.hide(5)).toBe('/lms/seances/5/hide')
      expect(l.seances.unhide(5)).toBe('/lms/seances/5/unhide')
      expect(l.seances.delete(5)).toBe('/lms/seances/5')
    })
    it('visio', () => {
      expect(l.visio.toggle(5)).toBe('/lms/seances/5/toggle-visio')
      expect(l.visio.activate(5)).toBe('/lms/seances/5/activate-visio')
      expect(l.visio.deactivate(5)).toBe('/lms/seances/5/deactivate-visio')
      expect(l.visio.start(5)).toBe('/lms/seances/5/start-visio')
      expect(l.visio.end(5)).toBe('/lms/seances/5/end-visio')
      expect(l.visio.join(5)).toBe('/lms/seances/5/join')
      expect(l.visio.leave(5)).toBe('/lms/seances/5/leave')
      expect(l.visio.heartbeat(5)).toBe('/lms/seances/5/heartbeat')
      expect(l.visio.participants(5)).toBe('/lms/seances/5/visio-participants')
      expect(l.visio.recordingStatus(5)).toBe('/lms/seances/5/recording')
      expect(l.visio.recordingStart(5)).toBe('/lms/seances/5/recording/start')
      expect(l.visio.recordingStop(5)).toBe('/lms/seances/5/recording/stop')
    })
    it('attendance', () => {
      expect(l.attendance.history).toBe('/lms/attendance/history')
      expect(l.attendance.fromVideoSession).toBe('/lms/attendances/from-video-session')
    })
  })

  describe('valeurs exactes — admin / lessons / quizzes / dashboard / forum / divers', () => {
    it('admin', () => {
      expect(endpoints.admin.matieres).toBe('/admin/matieres')
      expect(endpoints.admin.institutions.list).toBe('/admin/institutions')
      expect(endpoints.admin.institutions.details(2)).toBe('/admin/institutions/2')
      expect(endpoints.admin.institutions.toggle(2)).toBe('/admin/institutions/2/toggle')
      expect(endpoints.admin.institutions.testConnection(2)).toBe('/admin/institutions/2/test-connection')
    })
    it('lessons / quizzes', () => {
      expect(endpoints.lessons.list).toBe('/lessons')
      expect(endpoints.lessons.details(1)).toBe('/lessons/1')
      expect(endpoints.lessons.myCourses).toBe('/lessons/my-courses')
      expect(endpoints.quizzes.list).toBe('/quizzes')
      expect(endpoints.quizzes.details(1)).toBe('/quizzes/1')
      expect(endpoints.quizzes.start(1)).toBe('/quizzes/1/start')
      expect(endpoints.quizzes.submitAttempt(8)).toBe('/quiz-attempts/8/submit')
    })
    it('dashboard / forum / teacher / evaluations', () => {
      expect(endpoints.dashboard.student).toBe('/dashboard/student')
      expect(endpoints.dashboard.teacher).toBe('/dashboard/teacher')
      expect(endpoints.dashboard.stats).toBe('/dashboard/stats')
      expect(endpoints.forum.topics).toBe('/forum/topics')
      expect(endpoints.forum.topic(4)).toBe('/forum/topics/4')
      expect(endpoints.forum.topicPosts(4)).toBe('/forum/topics/4/posts')
      expect(endpoints.forum.closeTopic(4)).toBe('/forum/topics/4/close')
      expect(endpoints.forum.pinTopic(4)).toBe('/forum/topics/4/pin')
      expect(endpoints.forum.post(6)).toBe('/forum/posts/6')
      expect(endpoints.forum.postSolution(6)).toBe('/forum/posts/6/solution')
      expect(endpoints.teacher.stats).toBe('/teacher/stats')
      expect(endpoints.evaluations.student).toBe('/evaluations/student')
    })
  })

  describe('couverture — tous les chemins en dur recensés (api.js/klassci.js/lms*.js)', () => {
    it('chaque chemin attendu est présent dans la carte (set complet)', () => {
      const resolved = new Set(flatten(endpoints).map(([, url]) => url))
      const EXPECTED = [
        // api.js
        '/lessons', '/lessons/:id', '/quizzes', '/quizzes/:id', '/quizzes/:id/start',
        '/quiz-attempts/:id/submit', '/dashboard/student', '/dashboard/teacher',
        '/dashboard/stats', '/forum/topics', '/forum/topics/:id', '/forum/topics/:id/posts',
        '/forum/topics/:id/close', '/forum/topics/:id/pin', '/forum/posts/:id',
        '/forum/posts/:id/solution', '/teacher/stats', '/admin/institutions',
        '/admin/institutions/:id', '/admin/institutions/:id/toggle',
        '/admin/institutions/:id/test-connection',
        // klassci.js (/proxy/* + chemins partagés)
        '/proxy/classes', '/proxy/classes/:id', '/proxy/classes/:id/etudiants',
        '/proxy/matieres', '/proxy/enseignants', '/proxy/emploi-temps', '/proxy/structure',
        '/proxy/evaluations', '/proxy/me/dashboard', '/proxy/me/teacher-dashboard',
        '/lessons/my-courses', '/admin/matieres', '/evaluations/student',
        // lms*.js (/lms/*)
        '/lms/enseignants', '/lms/classes/:id', '/lms/classes/:id/etudiants',
        '/lms/matieres/:id', '/lms/teacher/my-matieres', '/lms/seances/upcoming',
        '/lms/seances/history', '/lms/seances/my-teaching', '/lms/seances/my-classes',
        '/lms/seances/:id/details', '/lms/seances/:id/participants',
        '/lms/seances/:id/attendances', '/lms/seances/:id/validate-participant',
        '/lms/seances/:id/hide', '/lms/seances/:id/unhide', '/lms/seances/:id',
        '/lms/seances/:id/toggle-visio', '/lms/seances/:id/activate-visio',
        '/lms/seances/:id/deactivate-visio', '/lms/seances/:id/start-visio',
        '/lms/seances/:id/end-visio', '/lms/seances/:id/join', '/lms/seances/:id/leave',
        '/lms/seances/:id/heartbeat', '/lms/seances/:id/visio-participants',
        '/lms/seances/:id/recording', '/lms/seances/:id/recording/start',
        '/lms/seances/:id/recording/stop',
        '/lms/attendance/history', '/lms/attendances/from-video-session',
      ]
      const missing = EXPECTED.filter((p) => !resolved.has(p))
      expect(missing, `chemins manquants : ${missing.join(', ')}`).toEqual([])
    })
  })
})
