// Parcours fonctionnel du DEVOIR (PR 3) : une évaluation à question de dissertation, créée, publiée, passée,
// corrigée à la main, sa note vue par l'élève (selon `show_results` seul : `notes_published` n'est jamais lu pour
// l'élève, lms_backend#902) et, dans l'école KLASSCI, synchronisée (relue au journal du faux). Puis une évaluation B,
// sans copie, est modifiée et supprimée (dès qu'une copie existe, le produit verrouille). Chaque étape relue.
import { lireApi } from './fonctionnels.mjs'
import { ATTENTE, bouton, appel, refusServeur, ditLEcran, lu } from './gestes.mjs'
import {
  carteEvaluation, carteEnseignant, confirmer, creerLocale, creerVersionEnLigne, ouvrirEditeur, enregistrerEditeur,
  ajouterDissertation, publier, passer, corriger,
} from './gestes-evaluation.mjs'
import { readFileSync } from 'node:fs'

export const AUCUN_CHEMIN_TITRE = 'aucun chemin d’interface ne modifie le titre d’une évaluation'
export const PAS_D_EDITEUR = 'la version en ligne créée ne mène pas à l’éditeur de ses questions'

/** Les données du parcours, selon l'école. Dans l'école KLASSCI, les titres sont ceux des programmations. */
export function donneesDevoir(jeu) {
  const klassci = jeu?.ecole === 'klassci'
  const commun = { reponse: 'Une reponse fictive de l eleve.', points: 1, commentaire: 'Bon travail fictif.', note: 20 }
  return {
    a: { ...commun, titre: klassci ? jeu.devoirs.principal.titre : 'Devoir parcours, la dissertation', question: 'Commentez la regle de trois.' },
    b: {
      ...commun, titre: klassci ? jeu.devoirs.b.titre : 'Devoir parcours, evaluation B', question: 'Question B initiale.',
      questionModifiee: 'Question B modifiee.', titreModifie: 'Devoir parcours, evaluation B (revue)',
    },
  }
}

// ─── Les jugements des relectures (purs, testés) ─────────────────────────────────────────────

/** L'évaluation relue (GET /evaluations/{id}) porte ce qui est attendu. */
export function jugerEvaluation(lecture, id, attendu) {
  const ecart = lu(lecture, `/evaluations/${id}`)
  if (ecart) return { confirme: false, ecart }
  const d = lecture.corps?.data ?? {}
  const q = (d.questions ?? [])[0]
  const ecarts = [
    'titre' in attendu && d.titre !== attendu.titre && `titre relu « ${d.titre} », « ${attendu.titre} » attendu`,
    'publiee' in attendu && Boolean(d.is_published) !== attendu.publiee && `publication relue ${Boolean(d.is_published)}, ${attendu.publiee} attendue`,
    attendu.question && q?.question !== attendu.question && `question relue « ${q?.question} », « ${attendu.question} » attendue`,
    attendu.question && q?.type !== 'dissertation' && `type relu « ${q?.type} », « dissertation » attendu`,
    'show_results' in attendu && Boolean(d.show_results) !== attendu.show_results && `show_results relu ${Boolean(d.show_results)}`,
  ].filter(Boolean)
  return ecarts.length ? { confirme: false, ecart: ecarts.join(' ; ') } : { confirme: true, preuve: `évaluation ${id} relue : ${Object.keys(attendu).join(', ')} conformes` }
}

/** La copie de l'élève est remise (GET /evaluations/{id}/my-submission). */
export function jugerCopieRemise(lecture, id) {
  const ecart = lu(lecture, `/evaluations/${id}/my-submission`)
  if (ecart) return { confirme: false, ecart }
  const statut = lecture.corps?.data?.status
  return statut === 'soumis' ? { confirme: true, preuve: `copie remise relue (statut « soumis »), évaluation ${id}` }
    : { confirme: false, ecart: `statut de la copie relu « ${statut} », « soumis » attendu` }
}

/** La copie corrigée : statut, note et commentaire relus (GET /evaluations/{id}/results-by-class). */
export function jugerCorrection(lecture, id, ev) {
  const ecart = lu(lecture, `/evaluations/${id}/results-by-class`)
  if (ecart) return { confirme: false, ecart }
  const copies = lecture.corps?.data?.evaluation?.submissions ?? []
  const c = copies.find((s) => s.status === 'corrige')
  if (!c) return { confirme: false, ecart: `aucune copie « corrige » relue (${copies.map((s) => s.status).join(', ') || 'aucune copie'})` }
  if (Number(c.note_sur_20) !== ev.note) return { confirme: false, ecart: `note relue ${c.note_sur_20}, ${ev.note} attendue` }
  if (c.feedback !== ev.commentaire) return { confirme: false, ecart: 'le commentaire relu diffère de celui saisi' }
  return { confirme: true, preuve: `copie corrigée relue : ${ev.note}/20, commentaire conforme` }
}

/** L'élève voit sa note (show_results) : relue par l'API ET affichée par l'écran de ses résultats. */
export function jugerNoteEleve(lecture, ecran, id, ev) {
  const ecart = lu(lecture, `/evaluations/${id}/my-submission`)
  if (ecart) return { confirme: false, ecart }
  const note = lecture.corps?.data?.note_sur_20
  if (Number(note) !== ev.note) return { confirme: false, ecart: `note de l’élève relue ${note}, ${ev.note} attendue` }
  if (!String(ecran).includes(`${note}/20`)) return { confirme: false, ecart: `l’écran des résultats n’affiche pas « ${note}/20 »` }
  if (!String(ecran).includes(ev.commentaire)) return { confirme: false, ecart: 'l’écran des résultats n’affiche pas le commentaire' }
  return { confirme: true, preuve: `l’élève voit ${note}/20 et le commentaire (API et écran)` }
}

/** La note est ARRIVÉE à KLASSCI (journal du faux) : un envoi, HTTP 200, une note, de la valeur corrigée. */
export function jugerSynchronisation(lignes, klassciId, ev) {
  const envois = lignes.filter((l) => l.methode === 'POST' && l.chemin === `/evaluations/${klassciId}/notes`)
  if (envois.length !== 1) return { confirme: false, ecart: `${envois.length} envoi(s) de notes de ${klassciId} au journal de KLASSCI, 1 attendu` }
  const [l] = envois
  if (l.statut !== 200) return { confirme: false, ecart: `KLASSCI a rendu HTTP ${l.statut}` }
  if (l.nb_notes !== 1) return { confirme: false, ecart: `${l.nb_notes ?? 0} note(s) envoyée(s), 1 attendue` }
  if (Number(l.valeurs_notes?.[0]) !== ev.note) return { confirme: false, ecart: `note envoyée ${l.valeurs_notes?.[0]}, ${ev.note} corrigée` }
  return { confirme: true, preuve: `vu au journal de KLASSCI : 1 note de ${ev.note}, HTTP 200 (évaluation ${klassciId})` }
}

/** Le verrou d'une évaluation corrigée (#569) : VERT si le refus est DIT, sur la carte ou après l'essai. */
export function jugerVerrou(vu) {
  if (vu.messageCarte) return { confirme: true, preuve: `la carte ne propose plus la modification et dit : « ${vu.messageCarte} »` }
  if (vu.statut >= 200 && vu.statut < 300) return { confirme: false, ecart: `une évaluation qui a une copie a été modifiée (HTTP ${vu.statut})` }
  if (vu.dit && vu.dit !== 'aucun message affiché') return { confirme: true, preuve: `refus ${vu.statut} dit à l’écran : ${vu.dit}` }
  return { confirme: false, ecart: `refus ${vu.statut ?? '?'} NON dit à l’écran (bouton actif sur une évaluation verrouillée, Refs #569)` }
}

/** L'évaluation supprimée a DISPARU : 404, et absente de la liste de l'enseignant. */
export function jugerSuppressionEvaluation(lecture, liste, id) {
  if (lecture.statut !== 404) return { confirme: false, ecart: `GET /evaluations/${id} rend HTTP ${lecture.statut}, 404 attendu` }
  const ecart = lu(liste, '/evaluations')
  if (ecart) return { confirme: false, ecart }
  const lignes = Array.isArray(liste.corps?.data) ? liste.corps.data : liste.corps?.data?.data ?? []
  return lignes.some((e) => e.id === id) ? { confirme: false, ecart: `l’évaluation ${id} est encore listée` }
    : { confirme: true, preuve: `évaluation ${id} : 404, et absente de la liste` }
}

// ─── Les étapes ──────────────────────────────────────────────────────────────────────────────

const klassci = (ctx) => ctx.jeu.ecole === 'klassci'
const relire = (ctx, ev, attendu) => async () => jugerEvaluation(await lireApi(ctx.pages.enseignant, `/evaluations/${ev.id}`), ev.id, attendu)
const prendreId = (ev, cree) => { if (cree.id != null) ev.id = cree.id; return cree.rouge ? { rouge: cree.rouge } : {} }

/** La création, selon l'école ; l'URL d'arrivée de la version en ligne est gardée pour #570. */
async function creer(ctx, cle) {
  const ev = ctx.donnees[cle]
  if (!klassci(ctx)) return prendreId(ev, await creerLocale(ctx, ev))
  const cree = await creerVersionEnLigne(ctx, ev)
  ctx.etat[`arrivee_${cle}`] = cree.arrivee
  return prendreId(ev, cree)
}

const ETAPE = (cle, compte, libelle, requiert, action, relecture) => ({ cle, compte, libelle, requiert, action, relecture })

export const ETAPES_DEVOIR = Object.freeze([
  ETAPE('creer', 'enseignant', 'créer l’évaluation (version en ligne dans l’école KLASSCI)', [],
    (ctx) => creer(ctx, 'a'), (ctx) => relire(ctx, ctx.donnees.a, { titre: ctx.donnees.a.titre, publiee: false })()),
  ETAPE('editeur', 'enseignant', 'la création mène à l’éditeur de questions', ['creer'],
    async (ctx) => {
      if (!klassci(ctx)) return { nonTeste: 'école LMS : la création locale renvoie à la carte, sans éditeur (voulu : « ajoutez-les ensuite depuis sa carte »)' }
      const arrivee = ctx.etat.arrivee_a
      return arrivee?.pathname.includes('/edit-questions') ? {} : { rouge: `${PAS_D_EDITEUR} (arrivée : ${arrivee?.pathname}) (Refs #570)` }
    },
    async (ctx) => ({ confirme: true, preuve: `éditeur ouvert : ${ctx.etat.arrivee_a.pathname}` })),
  ETAPE('question', 'enseignant', 'ajouter la question de dissertation (résultats affichés)', ['creer'],
    (ctx) => ajouterDissertation(ctx, ctx.donnees.a), (ctx) => relire(ctx, ctx.donnees.a, { question: ctx.donnees.a.question, show_results: true })()),
  ETAPE('publier', 'enseignant', 'publier l’évaluation', ['question'],
    (ctx) => publier(ctx, ctx.donnees.a), (ctx) => relire(ctx, ctx.donnees.a, { publiee: true })()),
  ETAPE('passer', 'etudiant', 'passer l’évaluation et rendre sa copie', ['publier'],
    (ctx) => passer(ctx, ctx.donnees.a),
    async (ctx) => jugerCopieRemise(await lireApi(ctx.pages.etudiant, `/evaluations/${ctx.donnees.a.id}/my-submission`), ctx.donnees.a.id)),
  ETAPE('corriger', 'enseignant', 'corriger la copie à la main', ['passer'],
    (ctx) => corriger(ctx, ctx.donnees.a),
    async (ctx) => jugerCorrection(await lireApi(ctx.pages.enseignant, `/evaluations/${ctx.donnees.a.id}/results-by-class`), ctx.donnees.a.id, ctx.donnees.a)),
  ETAPE('note', 'etudiant', 'voir sa note (selon show_results ; notes_published jamais lu, lms_backend#902)', ['corriger'],
    async (ctx) => {
      const page = ctx.pages.etudiant
      await page.goto(`${ctx.base}/student/evaluations-list`, { waitUntil: 'domcontentloaded' })
      await bouton(carteEvaluation(page, ctx.donnees.a.titre).first(), 'Voir mes résultats').click()
      await page.waitForURL(/\/results/, { timeout: ATTENTE })
      await page.getByText('Note finale').first().waitFor({ timeout: ATTENTE })
      ctx.etat.ecranNote = await page.locator('#app').innerText()
      return {}
    },
    async (ctx) => jugerNoteEleve(await lireApi(ctx.pages.etudiant, `/evaluations/${ctx.donnees.a.id}/my-submission`), ctx.etat.ecranNote, ctx.donnees.a.id, ctx.donnees.a)),
  ETAPE('synchroniser', 'enseignant', 'synchroniser la note vers KLASSCI', ['corriger'],
    async (ctx) => {
      if (!klassci(ctx)) return { nonTeste: 'école LMS : aucune synchronisation vers KLASSCI' }
      const { carte, rouge } = await carteEnseignant(ctx, ctx.donnees.a.titre)
      if (rouge) return { rouge }
      const page = ctx.pages.enseignant
      ctx.etat.journalAvant = readFileSync(ctx.jeu.journal_klassci, 'utf8').split('\n').filter(Boolean).length
      const reponse = appel(page, 'POST', `/evaluations/${ctx.donnees.a.id}/sync-klassci`)
      await bouton(carte, 'Synchroniser les notes').click()
      await confirmer(page, 'vers KLASSCI')
      return (await refusServeur(page, reponse, 'la synchronisation')) ?? {}
    },
    async (ctx) => {
      const lignes = readFileSync(ctx.jeu.journal_klassci, 'utf8').split('\n').filter(Boolean).slice(ctx.etat.journalAvant).map((l) => JSON.parse(l))
      return jugerSynchronisation(lignes, ctx.jeu.devoirs.principal.id, ctx.donnees.a)
    }),
  ETAPE('verrou', 'enseignant', 'une évaluation corrigée ne se modifie plus (le refus est dit)', ['passer'],
    async (ctx) => {
      const { carte, rouge } = await carteEnseignant(ctx, ctx.donnees.a.titre)
      if (rouge) return { rouge }
      if (!(await bouton(carte, 'Modifier les questions').count())) {
        ctx.etat.verrou = { messageCarte: (await carte.innerText()).match(/Questions verrouillées[^\n]*/)?.[0] ?? null }
        return ctx.etat.verrou.messageCarte ? {} : { rouge: 'ni « Modifier les questions » ni motif du verrou sur la carte' }
      }
      const ouvert = await ouvrirEditeur(ctx, ctx.donnees.a)
      if (ouvert.rouge) return ouvert
      const page = ctx.pages.enseignant
      await page.getByPlaceholder('Écrivez votre question...').first().fill(`${ctx.donnees.a.question} (verrou)`)
      const reponse = appel(page, 'PUT', `/evaluations/${ctx.donnees.a.id}`)
      await bouton(page, 'Enregistrer les modifications').click()
      const statut = (await reponse).status()
      await page.waitForTimeout(1000)
      ctx.etat.verrou = { statut, dit: await ditLEcran(page) }
      return {}
    },
    async (ctx) => jugerVerrou(ctx.etat.verrou)),
  ETAPE('creer_b', 'enseignant', 'créer l’évaluation B (sans copie)', [],
    (ctx) => creer(ctx, 'b'), (ctx) => relire(ctx, ctx.donnees.b, { titre: ctx.donnees.b.titre, publiee: false })()),
  ETAPE('question_b', 'enseignant', 'ajouter une question à B', ['creer_b'],
    (ctx) => ajouterDissertation(ctx, ctx.donnees.b), (ctx) => relire(ctx, ctx.donnees.b, { question: ctx.donnees.b.question })()),
  ETAPE('modifier_b', 'enseignant', 'modifier la question de B', ['question_b'],
    async (ctx) => {
      const b = ctx.donnees.b
      const ouvert = await ouvrirEditeur(ctx, b)
      if (ouvert.rouge) return ouvert
      await ctx.pages.enseignant.getByPlaceholder('Écrivez votre question...').first().fill(b.questionModifiee)
      return enregistrerEditeur(ctx, b, 'la modification')
    },
    (ctx) => relire(ctx, ctx.donnees.b, { question: ctx.donnees.b.questionModifiee })()),
  ETAPE('titre_b', 'enseignant', 'modifier le titre de B', ['question_b'],
    async (ctx) => {
      if (klassci(ctx)) return { nonTeste: 'version en ligne d’une évaluation KLASSCI : son titre vient de KLASSCI (choix validé, #568)' }
      const b = ctx.donnees.b
      const ouvert = await ouvrirEditeur(ctx, b)
      if (ouvert.rouge) return ouvert
      const champ = ctx.pages.enseignant.locator('#evaluation-titre')
      if (!(await champ.count())) return { rouge: `${AUCUN_CHEMIN_TITRE} : l’écran d’édition n’a pas de champ titre (Refs #568)` }
      await champ.fill(b.titreModifie)
      const fait = await enregistrerEditeur(ctx, b, 'la modification du titre')
      if (!fait.rouge) b.titre = b.titreModifie
      return fait
    },
    (ctx) => relire(ctx, ctx.donnees.b, { titre: ctx.donnees.b.titreModifie })()),
  ETAPE('supprimer_b', 'enseignant', 'supprimer l’évaluation B', ['creer_b'],
    async (ctx) => {
      const b = ctx.donnees.b
      const { carte, rouge } = await carteEnseignant(ctx, b.titre)
      if (rouge) return { rouge }
      const page = ctx.pages.enseignant
      const reponse = appel(page, 'DELETE', `/evaluations/${b.id}`)
      await bouton(carte, 'Supprimer').click()
      await confirmer(page, 'Supprimer la version en ligne', 'Supprimer')
      return (await refusServeur(page, reponse, 'la suppression')) ?? {}
    },
    async (ctx) => jugerSuppressionEvaluation(
      await lireApi(ctx.pages.enseignant, `/evaluations/${ctx.donnees.b.id}`), await lireApi(ctx.pages.enseignant, '/evaluations'), ctx.donnees.b.id)),
])
