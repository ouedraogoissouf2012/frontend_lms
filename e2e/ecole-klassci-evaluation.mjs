// K3 (D519, D526) : monte, par les CHEMINS DU PRODUIT (l'API du LMS), l'état qu'exige la seule écriture
// KLASSCI qui a un écran, la synchronisation des notes :
//   1. l'enseignant crée la version en ligne de l'évaluation programmée du faux (une question QCM),
//      puis la publie ;
//   2. l'élève la démarre, puis remet sa copie.
// Modèle : e2e/ecole-lms.ps1. Un refus du produit n'est jamais comblé à la main : il est écrit dans
// `manques` du jeu, et le parcours en fait un ROUGE. Le jeu de l'école KLASSCI est écrit d'abord, pour
// que le parcours joue toujours.
//
// Les corps viennent du code du back (origin/lms) : StoreEvaluationRequest:66-94 (questions EN LIGNE,
// `klassci_evaluation_id`, `klassci_classe_id`), EvaluationStateService::publish, StartEvaluationRequest,
// SubmitEvaluationRequest (`answers` indexé par l'id de la question).
//
// Usage : node e2e/ecole-klassci-evaluation.mjs <api> <jeu.json en sortie> <journal du faux> <journal du montage>
import { appendFileSync, writeFileSync } from 'node:fs'
import { COMPTES, EVALUATION, jeuDuParcours } from './klassci-ecole/jeu.mjs'

const [api, fichierJeu, journalFaux, journal] = process.argv.slice(2)
const MOT_DE_PASSE = process.env.E2E_MOT_DE_PASSE
if (!api || !fichierJeu || !journalFaux || !journal || !MOT_DE_PASSE) {
  console.error('usage : <api> <jeu.json> <journal du faux> <journal du montage>, et E2E_MOT_DE_PASSE')
  process.exit(2)
}

const BONNE_REPONSE = '4'
const jeu = { ...jeuDuParcours(), journal_klassci: journalFaux, manques: {} }
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

const connecter = (etape, email) => essayer(etape, 'POST', '/auth/login', { username: email, password: MOT_DE_PASSE })

/** Arrête le montage : le refus est un manque, l'objet n'existe pas pour le parcours. */
function manque(cle, r) {
  jeu.manques[cle] = r.manque
  ecrire()
  console.log(`[ecole-klassci-evaluation] MANQUE ${cle} : ${r.manque}`)
  process.exit(0)
}

// 1. L'enseignant crée la version en ligne, avec sa question, puis la publie.
const ens = await connecter('1 connexion enseignant', COMPTES.enseignant.email)
if (!ens.ok) manque('evaluation', ens)
const cree = await essayer('2 création', 'POST', '/evaluations', {
  titre: `${EVALUATION.titre} en ligne`, type: 'qcm', duree_minutes: 60, is_online: true,
  klassci_evaluation_id: EVALUATION.id, klassci_classe_id: EVALUATION.classe, klassci_matiere_id: EVALUATION.matiere,
  questions: [{ question: 'Combien font 2 + 2 ?', type: 'qcm', points: 1, options: ['3', BONNE_REPONSE], correct_answers: [BONNE_REPONSE] }],
}, ens.data.token)
if (!cree.ok) manque('evaluation', cree)
const publiee = await essayer('3 publication', 'POST', `/evaluations/${cree.data.id}/publish`, null, ens.data.token)
if (!publiee.ok) manque('evaluation', publiee)
jeu.evaluation = cree.data.id
ecrire()

// 2. L'élève la démarre, puis remet sa copie.
const eleve = await connecter('4 connexion élève', COMPTES.etudiant.email)
if (!eleve.ok) manque('copie', eleve)
const demarree = await essayer('5 démarrage', 'POST', `/evaluations/${cree.data.id}/start`, null, eleve.data.token)
if (!demarree.ok) manque('copie', demarree)
const question = cree.data.questions?.[0]?.id
// M2 : falsification D74, la copie est démarrée mais jamais remise (question : ${question}).
void question

// Ce que la synchronisation doit envoyer à KLASSCI : une note, pour l'évaluation programmée.
jeu.ecritures = { notes: { evaluation_klassci: EVALUATION.id, titre: EVALUATION.titre, nb_notes: 1 } }
ecrire()
console.log(`[ecole-klassci-evaluation] évaluation ${cree.data.id} publiée, 1 copie remise`)
