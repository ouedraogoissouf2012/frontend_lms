// Parcours fonctionnel du QUIZ (PR 2) : la vérification de connaissances d'un chapitre. L'enseignant prépare sa
// leçon et un chapitre « quiz » (gestes de la leçon), crée le quiz avec deux questions, le modifie, publie la
// leçon ; l'élève démarre le quiz et le soumet ; l'enseignant supprime le quiz, puis la leçon. Chaque étape relue.
//
// Sélecteurs : textes visibles et placeholders (#563). Structurels, déclarés : le bloc d'un chapitre
// (`.chapter-block`), l'éditeur du quiz (`.knowledge-check-editor`), le lecteur du quiz de l'élève
// (`.knowledge-check-player`) et le bouton radio de la bonne réponse (`input[name="correct-N"]`, sans libellé).
import { lireApi } from './fonctionnels.mjs'
import { ATTENTE, bouton, appel, refusServeur, lu, formulaireDeChapitre } from './gestes.mjs'
import { ETAPES_LECON } from './parcours-lecon.mjs'

export const AUCUN_CHEMIN_SUPPRESSION_QUIZ = 'aucun chemin d’interface ne supprime un quiz'
const QUIZ_ABSENT_ELEVE = "Le quiz n'est pas encore disponible."

export const DONNEES_QUIZ = Object.freeze({
  titre: 'Lecon parcours, le quiz des proportions',
  description: 'Une lecon fictive pour le quiz du parcours.',
  chapitre: 'Chapitre parcours, testez-vous',
  quiz: 'Quiz parcours, les proportions',
  quizModifie: 'Quiz parcours, les proportions (revu)',
  questions: Object.freeze([
    Object.freeze({ question: 'Combien font deux fois trois ?', options: Object.freeze(['Six', 'Sept']), bonne: 0 }),
    Object.freeze({ question: 'Combien font quatre fois cinq ?', options: Object.freeze(['Vingt', 'Trente']), bonne: 0 }),
  ]),
})

// ─── Les jugements des relectures (purs, testés) ─────────────────────────────────────────────

// L'enseignant relit le quiz par la liste que lit SON écran (useChapterQuizzes : `?chapter_id=`, 1er quiz).
export const listeDesQuiz = (chapitreId) => `/knowledge-checks?chapter_id=${chapitreId}`

/** Le quiz du chapitre, relu : son titre et ses questions. Rend son id. */
export function jugerQuiz(lecture, chapitreId, titre, questions) {
  const ecart = lu(lecture, listeDesQuiz(chapitreId))
  if (ecart) return { confirme: false, ecart }
  const d = (Array.isArray(lecture.corps?.data) ? lecture.corps.data : [])[0]
  if (!d) return { confirme: false, ecart: `aucun quiz relu pour le chapitre ${chapitreId}` }
  if (d.title !== titre) return { confirme: false, ecart: `titre du quiz relu « ${d.title} », « ${titre} » attendu` }
  const relues = (d.questions ?? []).map((q) => q.question)
  const manquantes = questions.map((q) => q.question).filter((q) => !relues.includes(q))
  if (manquantes.length) return { confirme: false, ecart: `question(s) absente(s) du quiz relu : ${manquantes.join(' ; ')}` }
  return { confirme: true, id: d.id, preuve: `quiz ${d.id} relu : « ${titre} », ${relues.length} question(s)` }
}

/** La tentative de l'élève, relue : une remise, toutes les réponses justes. */
export function jugerTentative(lecture, quizId) {
  const ecart = lu(lecture, `/knowledge-checks/${quizId}/my-attempts`)
  if (ecart) return { confirme: false, ecart }
  const d = lecture.corps?.data ?? {}
  const n = (d.attempts ?? []).length
  if (n !== 1) return { confirme: false, ecart: `${n} tentative(s) remise(s) relue(s), 1 attendue` }
  if (d.best_score !== 100) return { confirme: false, ecart: `score relu ${d.best_score}, 100 attendu (bonnes réponses données)` }
  if (d.has_passed !== true) return { confirme: false, ecart: 'tentative relue non réussie' }
  return { confirme: true, preuve: `1 tentative remise, score 100, réussie (quiz ${quizId})` }
}

/** La suppression du quiz : aucun bouton ne la propose (#566), ou il faut l'écrire. */
export function jugerSuppressionQuiz(boutonVu) {
  return boutonVu ? { nonTeste: 'un bouton supprime désormais le quiz : l’étape est à compléter avec sa correction (#566)' }
    : { rouge: `${AUCUN_CHEMIN_SUPPRESSION_QUIZ} : ni le chapitre en lecture ni le chapitre en édition n’en offre (Refs #566)` }
}

/** Le quiz supprimé a DISPARU du chapitre : la liste de l'enseignant est vide. */
export function jugerQuizDisparu(lecture, chapitreId) {
  const ecart = lu(lecture, listeDesQuiz(chapitreId))
  if (ecart) return { confirme: false, ecart }
  const reste = (Array.isArray(lecture.corps?.data) ? lecture.corps.data : []).length
  return reste === 0 ? { confirme: true, preuve: `le chapitre ${chapitreId} n’a plus de quiz` }
    : { confirme: false, ecart: `${reste} quiz encore relu(s) pour le chapitre ${chapitreId}` }
}

// ─── Les gestes ──────────────────────────────────────────────────────────────────────────────

const lecon = (cle) => ETAPES_LECON.find((e) => e.cle === cle)

async function pageDesChapitres({ pages, base, etat }) {
  const page = pages.enseignant
  await page.goto(`${base}/teacher/lessons/${etat.lecon}/chapters`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
  return page
}

const blocDuChapitre = (page, titre) => page.locator('.chapter-block').filter({ hasText: titre })
// En édition, le titre du chapitre est la VALEUR d'un champ, pas un texte : le bloc ne se trouve plus par son
// titre (E2E 43772665766). Il se trouve par son formulaire ouvert (un seul chapitre en édition à la fois).
const blocEnEdition = (page) => page.locator('.chapter-block').filter({ has: page.getByPlaceholder('saisissez le titre') })

/** Remplit l'éditeur du quiz (création) : le titre, puis chaque question, ses options et sa bonne réponse. */
async function remplirLeQuiz(editeur, donnees) {
  await editeur.getByPlaceholder('Ex: Testez vos connaissances - Chapitre 1').fill(donnees.quiz)
  for (const [i, q] of donnees.questions.entries()) {
    await bouton(editeur, 'Ajouter une question').click()
    await editeur.getByPlaceholder('Posez votre question...').nth(i).fill(q.question)
    for (const [j, option] of q.options.entries()) await editeur.getByPlaceholder(`Option ${j + 1}`).nth(i).fill(option)
    await editeur.locator(`input[name="correct-${i}"]`).nth(q.bonne).check()
  }
}

const relireQuiz = async ({ pages, etat }, titre, donnees) => {
  const jugement = jugerQuiz(await lireApi(pages.enseignant, listeDesQuiz(etat.chapitre)), etat.chapitre, titre, donnees.questions)
  if (jugement.confirme) etat.quiz = jugement.id
  return jugement
}

// ─── Les étapes ──────────────────────────────────────────────────────────────────────────────

export const ETAPES_QUIZ = Object.freeze([
  { ...lecon('creer'), cle: 'lecon', libelle: 'préparer la leçon du quiz (depuis la matière)' },
  {
    cle: 'chapitre', compte: 'enseignant', libelle: 'ajouter un chapitre de type quiz', requiert: ['lecon'],
    async action({ pages, donnees, etat }) {
      const page = pages.enseignant
      await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
      await (await formulaireDeChapitre(page)).fill(donnees.chapitre)
      await page.locator('select', { has: page.locator('option', { hasText: 'Quiz / Testez vos connaissances' }) }).first().selectOption('quiz')
      const reponse = appel(page, 'POST', `/lessons/${etat.lecon}/chapters`)
      await page.getByRole('button', { name: 'Créer', exact: true }).click()
      return (await refusServeur(page, reponse, 'le chapitre quiz')) ?? {}
    },
    async relecture({ pages, donnees, etat }) {
      const lecture = await lireApi(pages.enseignant, `/lessons/${etat.lecon}/chapters`)
      const ecart = lu(lecture, `/lessons/${etat.lecon}/chapters`)
      if (ecart) return { confirme: false, ecart }
      const c = (lecture.corps?.data ?? []).find((x) => x.title === donnees.chapitre)
      if (!c) return { confirme: false, ecart: `aucun chapitre « ${donnees.chapitre} » relu` }
      etat.chapitre = c.id
      return c.content_type === 'quiz' ? { confirme: true, preuve: `chapitre ${c.id} relu, de type quiz` }
        : { confirme: false, ecart: `chapitre ${c.id} relu de type « ${c.content_type} », « quiz » attendu` }
    },
  },
  {
    cle: 'creer', compte: 'enseignant', libelle: 'créer le quiz (deux questions)', requiert: ['chapitre'],
    async action(ctx) {
      const page = await pageDesChapitres(ctx)
      await bouton(blocDuChapitre(page, ctx.donnees.chapitre), 'Creer un quiz').click()
      const editeur = page.locator('.knowledge-check-editor')
      await remplirLeQuiz(editeur, ctx.donnees)
      const reponse = appel(page, 'POST', '/knowledge-checks')
      await bouton(editeur, 'Enregistrer').click()
      return (await refusServeur(page, reponse, 'la création du quiz')) ?? {}
    },
    relecture: (ctx) => relireQuiz(ctx, ctx.donnees.quiz, ctx.donnees),
  },
  {
    cle: 'modifier', compte: 'enseignant', libelle: 'modifier le titre du quiz', requiert: ['creer'],
    async action(ctx) {
      const page = await pageDesChapitres(ctx)
      await bouton(blocDuChapitre(page, ctx.donnees.chapitre), 'Modifier').click()
      await bouton(blocEnEdition(page), 'Modifier le quiz').click()
      const editeur = page.locator('.knowledge-check-editor')
      await editeur.getByPlaceholder('Ex: Testez vos connaissances - Chapitre 1').fill(ctx.donnees.quizModifie)
      const reponse = appel(page, 'PUT', `/knowledge-checks/${ctx.etat.quiz}`)
      await bouton(editeur, 'Enregistrer').click()
      return (await refusServeur(page, reponse, 'la modification du quiz')) ?? {}
    },
    relecture: (ctx) => relireQuiz(ctx, ctx.donnees.quizModifie, ctx.donnees),
  },
  { ...lecon('publier'), requiert: ['lecon'] },
  {
    cle: 'demarrer', compte: 'etudiant', libelle: 'démarrer le quiz (depuis la leçon publiée)', requiert: ['publier', 'creer'],
    async action(ctx) {
      const ouverte = await lecon('ouvrir').action(ctx)
      if (ouverte.rouge) return ouverte
      const page = ctx.pages.etudiant
      await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
      // L'élève lit le quiz par `knowledge-checks/chapter/{id}` (useStudentLessonView) : sans lui, l'écran le dit.
      if (!(await bouton(page, 'Commencer').count()) && await page.getByText(QUIZ_ABSENT_ELEVE).count()) {
        return { rouge: `l’élève lit « ${QUIZ_ABSENT_ELEVE} » sur le chapitre du quiz créé` }
      }
      const reponse = appel(page, 'POST', `/knowledge-checks/${ctx.etat.quiz}/start`)
      await bouton(page, 'Commencer').click()
      return (await refusServeur(page, reponse, 'le démarrage du quiz')) ?? {}
    },
    // L'écran suivant : la première question est posée.
    async relecture({ pages, donnees }) {
      const premiere = donnees.questions[0].question
      const vue = await pages.etudiant.getByText(premiere).first().waitFor({ timeout: ATTENTE }).then(() => true, () => false)
      return vue ? { confirme: true, preuve: `la première question est posée : « ${premiere} »` }
        : { confirme: false, ecart: 'le quiz démarré ne pose pas sa première question' }
    },
  },
  {
    cle: 'soumettre', compte: 'etudiant', libelle: 'soumettre les bonnes réponses', requiert: ['demarrer'],
    async action({ pages, donnees, etat }) {
      const page = pages.etudiant
      // Le lecteur du quiz : la page de la leçon a aussi son « Suivant » (chapitre suivant, E2E 43772665766).
      const lecteur = page.locator('.knowledge-check-player')
      const reponse = appel(page, 'POST', `/knowledge-checks/${etat.quiz}/submit`)
      for (const [i, q] of donnees.questions.entries()) {
        await lecteur.getByLabel(q.options[q.bonne], { exact: true }).check()
        await bouton(lecteur, i < donnees.questions.length - 1 ? 'Suivant' : 'Terminer').click()
      }
      return (await refusServeur(page, reponse, 'la remise du quiz')) ?? {}
    },
    relecture: async ({ pages, etat }) => jugerTentative(await lireApi(pages.etudiant, `/knowledge-checks/${etat.quiz}/my-attempts`), etat.quiz),
  },
  {
    cle: 'supprimer', compte: 'enseignant', libelle: 'supprimer le quiz', requiert: ['creer'],
    async action(ctx) {
      const page = await pageDesChapitres(ctx)
      const bloc = blocDuChapitre(page, ctx.donnees.chapitre)
      const chercher = async (lieu) => (await lieu.getByRole('button', { name: /supprimer (le|ce) quiz/i }).count()) > 0
      // Compter après le RENDU, jamais juste après un clic (#565 : une mesure prématurée lisait l'écran d'avant).
      // Le quiz est chargé, en lecture (« Retenter » quand `user_best_score` n'est pas null, absent compris).
      await bloc.getByRole('button', { name: /(Commencer|Retenter) le quiz/ }).waitFor({ timeout: ATTENTE })
      let vu = await chercher(bloc)
      if (!vu) {
        await bouton(bloc, 'Modifier').click()
        const edition = blocEnEdition(page)
        await bouton(edition, 'Modifier le quiz').waitFor({ timeout: ATTENTE }) // le chapitre est en édition
        vu = await chercher(edition)
      }
      return jugerSuppressionQuiz(vu)
    },
    // Jouée seulement quand un bouton existera (#566) : le quiz doit avoir disparu du chapitre.
    relecture: async ({ pages, etat }) => jugerQuizDisparu(await lireApi(pages.enseignant, listeDesQuiz(etat.chapitre)), etat.chapitre),
  },
  { ...lecon('supprimer'), cle: 'nettoyer', libelle: 'supprimer la leçon du quiz', requiert: ['lecon'] },
])
