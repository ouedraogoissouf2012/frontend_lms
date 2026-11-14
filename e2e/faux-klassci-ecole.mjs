// Faux KLASSCI « école » de l'E2E (K1, D481) : il SERT le jeu fictif de e2e/klassci-ecole/jeu.mjs.
//
// Le faux à 503 (e2e/faux-klassci.mjs) garde son rôle de mesure pour l'école LMS ; celui-ci sert
// l'école KLASSCI. Chaque appel est journalisé : méthode, chemin, statut rendu, et les CLÉS du corps
// (jamais ses valeurs, qui peuvent porter un mot de passe). Une route absente du jeu rend 404 : la
// liste des 404 est la mesure de ce qui manque au jeu.
//
// Usage : node e2e/faux-klassci-ecole.mjs <port> <journal.jsonl> <jeu-du-parcours.json>
// Le mot de passe des comptes est le secret du run (E2E_MOT_DE_PASSE), jamais écrit dans un fichier.
import { createServer } from 'node:http'
import { appendFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { COMPTES, REPONSES, utilisateur, jeuDuParcours } from './klassci-ecole/jeu.mjs'

const [port = '8181', journal = 'faux-klassci-ecole.jsonl', fichierJeu = 'jeu-klassci.json'] = process.argv.slice(2)
const MOT_DE_PASSE = process.env.E2E_MOT_DE_PASSE
if (!MOT_DE_PASSE) { console.error('E2E_MOT_DE_PASSE absent'); process.exit(2) }
writeFileSync(fichierJeu, JSON.stringify(jeuDuParcours(), null, 2))

const jetons = new Map() // jeton → compte, émis à la connexion

function lireCorps(req) {
  return new Promise((resolve) => {
    let brut = ''
    req.on('data', (d) => { brut += d })
    req.on('end', () => { try { resolve(brut ? JSON.parse(brut) : null) } catch { resolve(null) } })
  })
}

function repondre(res, statut, corps) {
  res.writeHead(statut, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(corps))
}

createServer(async (req, res) => {
  const chemin = req.url.split('?')[0].replace(/\/+$/, '') || '/'
  const corps = await lireCorps(req)
  const cle = `${req.method} ${chemin}`
  const jeton = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  const compte = jetons.get(jeton) ?? null
  let statut = 200
  let reponse

  if (cle === 'POST /auth/login') {
    const c = Object.values(COMPTES).find((x) => x.email === corps?.username)
    if (!c || corps?.password !== MOT_DE_PASSE) { statut = 401; reponse = { success: false, message: 'Identifiants incorrects (faux KLASSCI)' } }
    else {
      const nouveau = randomUUID()
      jetons.set(nouveau, c)
      reponse = { success: true, data: { token: nouveau, user: utilisateur(c) }, meta: { annee_universitaire_courante: '2026-2027' } }
    }
  } else if (!(cle in REPONSES) || chemin === '/') {
    statut = chemin === '/' ? 200 : 404
    reponse = chemin === '/' ? { success: true, data: { faux: 'klassci-ecole' } } : { success: false, message: 'Route absente du jeu (faux KLASSCI)' }
  } else if (cle === 'POST /auth/check-user') {
    reponse = REPONSES[cle](null, corps)
  } else if (!compte) {
    statut = 401; reponse = { success: false, message: 'Jeton absent ou inconnu (faux KLASSCI)' }
  } else {
    reponse = REPONSES[cle](compte, corps)
    if (reponse === null) { statut = 403; reponse = { success: false, message: 'Hors de la portée de ce compte (faux KLASSCI)' } }
  }

  appendFileSync(journal, JSON.stringify({
    t: new Date().toISOString(), methode: req.method, chemin, statut, compte: compte?.role ?? null,
    cles: corps && typeof corps === 'object' ? Object.keys(corps) : [],
  }) + '\n')
  repondre(res, statut, reponse)
}).listen(Number(port), '127.0.0.1', () => console.log(`faux KLASSCI école sur 127.0.0.1:${port}`))
