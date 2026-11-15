// Les parcours FONCTIONNELS d'une école (après le parcours des écrans) : l'enseignant crée, modifie, publie et
// supprime ; l'élève de sa classe suit. Chaque étape est relue (e2e/fonctionnels.mjs). PR 1 : la leçon.
//
// Usage : node e2e/parcours-fonctionnels.mjs <jeu.json> <dossier de sortie>
// Sorties : fonctionnels.json (une case par école, fonction, étape et compte) et fonctionnels.md (le résumé).
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { connecter } from './connexion.mjs'
import { moteurFonctionnel, resumeFonctionnel } from './fonctionnels.mjs'
import { ETAPES_LECON, DONNEES_LECON } from './parcours-lecon.mjs'

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

const moteur = moteurFonctionnel({ ecole, fonction: 'leçon' })
const ctx = { pages, base: BASE, jeu, donnees: DONNEES_LECON, etat: {} }
for (const e of ETAPES_LECON) {
  const connexion = connexions[e.compte]
  await moteur.etape({
    cle: e.cle, compte: e.compte, libelle: e.libelle, requiert: e.requiert, page: pages[e.compte],
    action: connexion.connecte ? () => e.action(ctx) : () => ({ nonTeste: `connexion du compte impossible : « ${connexion.alerte || 'aucun message'} »` }),
    relecture: () => e.relecture(ctx),
  })
}
await navigateur.close()

writeFileSync(join(sortie, 'fonctionnels.json'), JSON.stringify(moteur.cases, null, 2))
const resume = resumeFonctionnel(moteur.cases, ecole === 'klassci' ? 'école KLASSCI (faux KLASSCI « école »)' : 'école créée depuis le LMS')
writeFileSync(join(sortie, 'fonctionnels.md'), resume)
console.log(resume.split('\n').slice(0, 3).join('\n'))
