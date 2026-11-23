// Les parcours FONCTIONNELS d'une école (après le parcours des écrans) : l'enseignant crée, modifie, publie et
// supprime ; l'élève de sa classe suit. Chaque étape est relue (e2e/fonctionnels.mjs). Les fonctions, dans
// l'ordre : la leçon (PR 1), le quiz (PR 2), le devoir (PR 3), la séance et la visio (PR 4), le mot de passe oublié
// (#613) et le lien d'activation mort (#614), joués par un anonyme, la vidéo interne d'un chapitre (#616). Chacune
// a son moteur et son état : un ROUGE n'en traverse aucune autre.
//
// Usage : node e2e/parcours-fonctionnels.mjs <jeu.json> <dossier de sortie>
// Sorties : fonctionnels.json (une case par école, fonction, étape et compte) et fonctionnels.md (le résumé).
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { connecter } from './connexion.mjs'
import { moteurFonctionnel, resumeFonctionnel } from './fonctionnels.mjs'
import { ETAPES_LECON, DONNEES_LECON } from './parcours-lecon.mjs'
import { ETAPES_QUIZ, DONNEES_QUIZ } from './parcours-quiz.mjs'
import { ETAPES_DEVOIR, donneesDevoir } from './parcours-devoir.mjs'
import { ETAPES_SEANCE, DONNEES_SEANCE } from './parcours-seance.mjs'
import { ETAPES_MOT_DE_PASSE, DONNEES_MOT_DE_PASSE } from './parcours-mot-de-passe.mjs'
import { ETAPES_ACTIVATION, DONNEES_ACTIVATION } from './parcours-activation.mjs'
import { ETAPES_VIDEO_INTERNE, DONNEES_VIDEO_INTERNE } from './parcours-video-interne.mjs'

const FONCTIONS = [
  { fonction: 'leçon', etapes: ETAPES_LECON, donnees: DONNEES_LECON },
  { fonction: 'quiz', etapes: ETAPES_QUIZ, donnees: DONNEES_QUIZ },
  // Les données du devoir dépendent de l'école (titres des programmations KLASSCI) : une fonction du jeu.
  { fonction: 'devoir', etapes: ETAPES_DEVOIR, donnees: donneesDevoir },
  { fonction: 'séance', etapes: ETAPES_SEANCE, donnees: DONNEES_SEANCE },
  { fonction: 'mot de passe oublié', etapes: ETAPES_MOT_DE_PASSE, donnees: DONNEES_MOT_DE_PASSE },
  { fonction: 'lien d’activation mort', etapes: ETAPES_ACTIVATION, donnees: DONNEES_ACTIVATION },
  { fonction: 'vidéo interne', etapes: ETAPES_VIDEO_INTERNE, donnees: DONNEES_VIDEO_INTERNE },
]

const [fichierJeu, sortie] = process.argv.slice(2)
const BASE = 'http://127.0.0.1:4173'
const jeu = JSON.parse(readFileSync(fichierJeu, 'utf8'))
const ecole = jeu.ecole === 'klassci' ? 'klassci' : 'lms'

const navigateur = await chromium.launch()
const pages = {}
const connexions = {}
for (const compte of ['enseignant', 'etudiant']) {
  const page = await (await navigateur.newContext()).newPage()
  connexions[compte] = jeu.comptes[compte] ? await connecter(page, BASE, jeu.comptes[compte], process.env.E2E_MOT_DE_PASSE) : { connecte: false, alerte: 'compte absent du jeu' }
  pages[compte] = page
}
// #613 : « Mot de passe oublié » est réservé aux anonymes (guest) : une page sans connexion, rien à ouvrir.
pages.anonyme = await (await navigateur.newContext()).newPage()
connexions.anonyme = { connecte: true, alerte: '' }

const cases = []
for (const { fonction, etapes, donnees } of FONCTIONS) {
  const moteur = moteurFonctionnel({ ecole, fonction })
  const ctx = { pages, base: BASE, jeu, donnees: typeof donnees === 'function' ? donnees(jeu) : donnees, etat: {} }
  for (const e of etapes) {
    const connexion = connexions[e.compte]
    await moteur.etape({
      cle: e.cle, compte: e.compte, libelle: e.libelle, requiert: e.requiert, page: pages[e.compte],
      action: connexion.connecte ? () => e.action(ctx) : () => ({ nonTeste: `connexion du compte impossible : « ${connexion.alerte || 'aucun message'} »` }),
      relecture: () => e.relecture(ctx),
    })
  }
  cases.push(...moteur.cases)
}
await navigateur.close()

writeFileSync(join(sortie, 'fonctionnels.json'), JSON.stringify(cases, null, 2))
const resume = resumeFonctionnel(cases, ecole === 'klassci' ? 'école KLASSCI (faux KLASSCI « école »)' : 'école créée depuis le LMS')
writeFileSync(join(sortie, 'fonctionnels.md'), resume)
console.log(resume.split('\n').slice(0, 3).join('\n'))
