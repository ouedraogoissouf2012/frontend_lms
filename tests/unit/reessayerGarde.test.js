// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * Garde : un bouton « Réessayer » ne s'affiche que sur une panne passagère (suite de #517).
 *
 * Un bouton dont le texte dit « Réessayer » doit porter sa condition sur sa propre balise :
 * `v-if` (ou `v-show`) qui lit `canRetry` ou `peutReessayer`. La condition du bloc parent
 * (`v-if="error"`) ne suffit pas : elle montre le bouton sur un refus définitif.
 *
 * Cliquet : la liste gelée est celle des sites connus, à corriger dans les PR suivantes. Un site
 * nouveau fait rougir ; un site corrigé mais encore listé aussi (la liste doit rétrécir).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const racine = fileURLToPath(new URL('../../src', import.meta.url))
const fichiers = (dossier) => readdirSync(dossier).flatMap((n) => {
  const p = join(dossier, n)
  return statSync(p).isDirectory() ? fichiers(p) : n.endsWith('.vue') ? [p] : []
})

// Une balise <button …> suivie (avant sa fermeture) d'un texte « Réessayer ».
const BOUTON = /<button\b([^>]*)>((?:(?!<\/button>)[\s\S])*?R[ée]essayer(?:(?!<\/button>)[\s\S])*?)<\/button>/g
const CONDITIONNE = /\bv-(?:if|show)="[^"]*\b(?:canRetry|peutReessayer)\b[^"]*"/

function boutonsSansCondition(texte) {
  const gabarit = texte.split('<script')[0]
  return [...gabarit.matchAll(BOUTON)].filter(([, attributs]) => !CONDITIONNE.test(attributs))
}

// Sites connus le 10/11/2026 après la PR A (28 fichiers mesurés par cette garde avant elle, 6
// corrigés). PR B : vues et composants hors évaluations ; PR C (chantier D72) : les écrans
// d'évaluation et la visio d'admin. DashboardCalendarPanel et CoursesLoadMore disent « Réessayer »
// après une erreur : à trier en PR B.
const CONNUS = [
  'components/attendance/AttendanceDetailModal.vue',
  'components/dashboard/DashboardCalendarPanel.vue',
  'components/evaluations/TeacherEvalErrorState.vue',
  'components/lessons/LoadRetryNotice.vue',
  'components/student/CoursesLoadMore.vue',
  'views/admin/AdminClasses.vue',
  'views/admin/AdminEvaluationDetails.vue',
  'views/admin/AdminEvaluationResults.vue',
  'views/admin/AdminUsers.vue',
  'views/admin/AdminVisio.vue',
  'views/attendance/SeanceAttendanceHistory.vue',
  'views/coordinateur/CoordinatorEvaluations.vue',
  'views/coordinateur/SeanceManagement.vue',
  'views/dashboards/AdminDashboard.vue',
  'views/dashboards/TeacherDashboard.vue',
  'views/evaluations/PreviewEvaluation.vue',
  'views/lessons/LessonChapters.vue',
  'views/lessons/TeacherLessons.vue',
  'views/student/StudentCourses.vue',
  'views/student/StudentGrades.vue',
  'views/teacher/EvaluationCorrections.vue',
  'views/teacher/TeacherMatieres.vue',
]

describe('garde : « Réessayer » porte sa condition de panne passagère', () => {
  it('aucun NOUVEAU bouton « Réessayer » sans condition dans src/ (cliquet)', () => {
    const fautifs = fichiers(racine)
      .filter((f) => boutonsSansCondition(readFileSync(f, 'utf8')).length > 0)
      .map((f) => relative(racine, f).split(sep).join('/'))
      .sort()
    expect(fautifs).toEqual(CONNUS)
  })

  it('la garde mord : un bouton sous le seul v-if du parent est fautif, un bouton conditionné ne l’est pas', () => {
    expect(boutonsSansCondition('<div v-if="error"><button @click="load">Réessayer</button></div>')).toHaveLength(1)
    expect(boutonsSansCondition('<button v-if="canRetry" @click="load">\n  Réessayer\n</button>')).toHaveLength(0)
    expect(boutonsSansCondition('<button v-if="erreur && peutReessayer" @click="r">Réessayer</button>')).toHaveLength(0)
    expect(boutonsSansCondition('<button v-if="error" @click="load"><i class="fa fa-redo"></i> Réessayer</button>')).toHaveLength(1)
  })
})
