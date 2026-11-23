// Monte, par les CHEMINS DU PRODUIT (l'API du LMS), l'état de l'école KLASSCI que le parcours visite.
//   K3 (D519, D526) : l'état qu'exige la synchronisation des notes : l'enseignant crée la version en ligne de
//     l'évaluation programmée du faux (une question QCM) et la publie ; l'élève la démarre et remet sa copie.
//   K4 (D609) : le CONTENU DU LMS d'une école KLASSCI : l'enseignant crée une leçon publiée et une leçon brouillon
//     (après avoir ouvert ses matières, ce qui pose par le produit le miroir de ses classes) ; l'élève crée un
//     sujet de forum. La SÉANCE, elle, vient de KLASSCI : le faux la sert (`emploi-temps`, forme mesurée).
// Modèle : e2e/ecole-lms.ps1. Un refus du produit n'est jamais comblé à la main : il est écrit dans `manques` du
// jeu, et le parcours en fait un ROUGE. Chaque montage est indépendant : un manque n'arrête pas les autres. Le jeu
// de l'école KLASSCI est écrit d'abord, pour que le parcours joue toujours.
//
// Les corps viennent du code du back (origin/lms) : StoreEvaluationRequest:66-94, EvaluationStateService::publish,
// StartEvaluationRequest, SubmitEvaluationRequest ; StoreLessonRequest (`title`, `type`, `classe_id` LOCAL seulement
// depuis lms_backend#1266, `matiere_id` local) ; StoreForumTopicRequest:17-33 (`title`, `content` de 10 caractères au moins).
//
// Usage : node e2e/ecole-klassci-evaluation.mjs <api> <jeu.json en sortie> <journal du faux> <journal du montage>
import { appendFileSync, writeFileSync } from 'node:fs'
import { CLASSES, COMPTES, EVALUATION, SEANCE, jeuDuParcours } from './klassci-ecole/jeu.mjs'
import { idsLocauxDeLecon } from './klassci-ecole/idsLocaux.mjs'

const [api, fichierJeu, journalFaux, journal] = process.argv.slice(2)
const MOT_DE_PASSE = process.env.E2E_MOT_DE_PASSE
if (!api || !fichierJeu || !journalFaux || !journal || !MOT_DE_PASSE) {
  console.error('usage : <api> <jeu.json> <journal du faux> <journal du montage>, et E2E_MOT_DE_PASSE')
  process.exit(2)
}

const BONNE_REPONSE = '4'
// La séance vient de KLASSCI (le faux la sert) : aucun montage, son id est celui du jeu.
const jeu = { ...jeuDuParcours(), journal_klassci: journalFaux, manques: {}, seance: SEANCE.id }
const ecrire = () => writeFileSync(fichierJeu, JSON.stringify(jeu, null, 2))
ecrire()

/** Un appel au produit : `{ ok, data }`, ou `{ ok: false, manque }` (la réponse brute va au journal). */
async function essayer(etape, methode, chemin, corps, jeton) {
  const entetes = { Accept: 'application/json', ...(corps ? { 'Content-Type': 'application/json' } : {}) }
  if (jeton) entetes.Authorization = `Bearer ${jeton}`
  let statut = 0
  let brut = ''
  try {
    const r = await fetch(`${api}${chemin}`, { method: methode, headers: entetes, body: corps ? JSON.stringify(corps) : undefined, signal: AbortSignal.timeout(60000) })
    statut = r.status
    brut = await r.text()
  } catch (e) {
    brut = String(e)
  }
  appendFileSync(journal, `${etape}\t${methode} ${chemin}\tHTTP ${statut}\n`)
  if (statut === 200 || statut === 201) return { ok: true, data: JSON.parse(brut).data }
  appendFileSync(journal, `REPONSE BRUTE :\n${brut.slice(0, 2000)}\n`)
  return { ok: false, manque: `${methode} ${chemin} a rendu HTTP ${statut} (${etape})` }
}

/** Un refus du produit : il arrête le montage en cours, et seulement lui. */
class Manque extends Error {}
const exiger = (r) => { if (!r.ok) throw new Manque(r.manque); return r.data }
const avecId = (data, etape) => { if (data?.id == null) throw new Manque(`réponse sans id (${etape})`); return data.id }

const jetons = {}
async function jetonDe(compte, etape) {
  jetons[compte] ??= exiger(await essayer(etape, 'POST', '/auth/login', { username: COMPTES[compte].email, password: MOT_DE_PASSE })).token
  return jetons[compte]
}

async function monter(cle, etapes) {
  try {
    await etapes()
  } catch (e) {
    if (!(e instanceof Manque)) throw e
    jeu.manques[cle] = e.message
    console.log(`[ecole-klassci] MANQUE ${cle} : ${e.message}`)
  }
  ecrire()
}

// K3. L'enseignant crée la version en ligne et la publie ; l'élève la démarre et remet sa copie.
let evaluation = null
await monter('evaluation', async () => {
  const j = await jetonDe('enseignant', '1 connexion enseignant')
  const cree = exiger(await essayer('2 création', 'POST', '/evaluations', {
    titre: `${EVALUATION.titre} en ligne`, type: 'qcm', duree_minutes: 60, is_online: true,
    klassci_evaluation_id: EVALUATION.id, klassci_classe_id: EVALUATION.classe, klassci_matiere_id: EVALUATION.matiere,
    questions: [{ question: 'Combien font 2 + 2 ?', type: 'qcm', points: 1, options: ['3', BONNE_REPONSE], correct_answers: [BONNE_REPONSE] }],
  }, j))
  exiger(await essayer('3 publication', 'POST', `/evaluations/${cree.id}/publish`, null, j))
  evaluation = cree
  jeu.evaluation = cree.id
})
if (evaluation) {
  await monter('copie', async () => {
    const j = await jetonDe('etudiant', '4 connexion élève')
    exiger(await essayer('5 démarrage', 'POST', `/evaluations/${evaluation.id}/start`, null, j))
    const question = evaluation.questions?.[0]?.id
    exiger(await essayer('6 remise', 'POST', `/evaluations/${evaluation.id}/submit`, { answers: { [question]: BONNE_REPONSE } }, j))
    // Ce que la synchronisation doit envoyer à KLASSCI : une note, pour l'évaluation programmée.
    jeu.ecritures = { notes: { evaluation_klassci: EVALUATION.id, titre: EVALUATION.titre, nb_notes: 1 } }
  })
}

// K4. Les leçons : l'enseignant ouvre ses matières (le produit pose le miroir de ses classes,
// MyMatieresQueryService:71-78), puis crée une leçon publiée et une leçon brouillon dans la classe KLASSCI 9101.
// #618 : par ses ids LOCAUX, lus sur la page de la matière comme le front (lms_backend#1266 refuse l'id KLASSCI).
await monter('lecon', async () => {
  const j = await jetonDe('enseignant', '7 connexion enseignant')
  exiger(await essayer('8 matières de l’enseignant', 'GET', '/lms/teacher/my-matieres', null, j))
  const page = exiger(await essayer('8 page de la matière', 'GET', `/lms/matieres/${EVALUATION.matiere}`, null, j))
  const ids = idsLocauxDeLecon(page, CLASSES.find((c) => c.id === EVALUATION.classe).name, EVALUATION.matiere)
  if (ids.manque) throw new Manque(`${ids.manque} (8 page de la matière)`)
  // Le titre est en français : une valeur d'énumération dans un titre (« published ») serait lue comme un texte brut.
  const lecon = (statut, titre, etape) => essayer(etape, 'POST', '/lessons', { title: titre, type: 'cours', ...ids, status: statut, description: 'Lecon fictive de l E2E.' }, j)
  const publiee = avecId(exiger(await lecon('published', 'Lecon K E2E, la lecture', '9 leçon publiée')), '9 leçon publiée')
  const brouillon = avecId(exiger(await lecon('draft', 'Lecon K E2E, en preparation', '10 leçon brouillon')), '10 leçon brouillon')
  jeu.lecons = { publiee, brouillon }
})

// K4. Le sujet de forum : l'élève le crée (tout compte de l'école le peut, StoreForumTopicRequest:17-33).
await monter('sujet', async () => {
  const j = await jetonDe('etudiant', '11 connexion élève')
  jeu.sujet = avecId(exiger(await essayer('12 sujet', 'POST', '/forum/topics', { title: 'Sujet K E2E', content: 'Un sujet fictif de l E2E, pour la mesure.' }, j)), '12 sujet')
})

console.log(`[ecole-klassci] montage fini ; manques : ${JSON.stringify(jeu.manques)}`)
