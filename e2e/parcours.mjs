// Parcours E2E écran par écran (D110/D111) : chaque route du routeur × chaque compte du jeu.
//
// Entrées : la liste des routes EXTRAITE du routeur (tests/e2e/routes.extraction.test.js), le jeu
// monté par e2e/ecole-lms.ps1 (ids fictifs). Le mot de passe et le supradmin viennent de
// l'environnement du job, jamais d'un fichier. Sorties : resultats.json, resume.md, captures.
//
// Usage : node e2e/parcours.mjs <routes.json> <jeu.json> <dossier de sortie>
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { routeurFerme, ouverte, sansObjetSansVisite, refusD56, refusServeur } from './acces.mjs'
import { BRUT, ECRAN_ERREUR, ecartsDeValeur } from './ecran.mjs'
import { verifsEcoleLms } from './verifs-ecole-lms.mjs'
import { verifsEcoleKlassci } from './verifs-ecole-klassci.mjs'

const [fichierRoutes, fichierJeu, sortie] = process.argv.slice(2)
const BASE = 'http://127.0.0.1:4173'
const MOT_DE_PASSE = process.env.E2E_MOT_DE_PASSE
const routes = JSON.parse(readFileSync(fichierRoutes, 'utf8'))
const ferme = routeurFerme(routes) // D126 : le routeur mesuré ferme-t-il l'école au supradmin ?
const jeu = JSON.parse(readFileSync(fichierJeu, 'utf8'))
const ECOLE_KLASSCI = jeu.ecole === 'klassci' // K1 : l'école mesurée (avant tout usage)
mkdirSync(join(sortie, 'captures'), { recursive: true })
const VERIFS = ECOLE_KLASSCI ? verifsEcoleKlassci(jeu) : verifsEcoleLms(jeu)

// Compte → rôle canonique du routeur, dans cet ordre. K1 : les comptes viennent du jeu de l'école
// mesurée ; le supradmin (plateforme) n'est joué qu'avec l'école LMS, qui le porte depuis D110.
// `admin_brut` (école KLASSCI, D499) : le rôle KLASSCI brut `admin`, rangé sous ADMIN par le routeur.
const ROLES = { admin: 'admin', admin_brut: 'admin', coordinateur: 'coordinateur', enseignant: 'enseignant', etudiant: 'etudiant', etudiant_inactif: 'etudiant' }
const COMPTES = [
  ...(ECOLE_KLASSCI ? [] : [{ compte: 'supradmin', email: process.env.E2E_SUPRADMIN_EMAIL, role: 'supradmin' }]),
  ...Object.keys(ROLES).filter((c) => jeu.comptes[c]).map((c) => ({ compte: c, email: jeu.comptes[c], role: ROLES[c] })),
]

const ID_FICTIF = '999999'

// Objets que le montage a tenté de créer par le produit : un refus de création (jeu.manques) est
// une fonction absente de ce type d'école, donc un ROUGE, jamais un NON TESTÉ.
const OBJETS = [
  { motif: /evaluation/, cle: 'evaluation', manque: 'fonction manquante (D72)' },
  { motif: /seance/, cle: 'seance', manque: 'création de séance refusée dans ce type d’école' },
  { motif: /forum|topic/, cle: 'sujet', manque: 'création de sujet de forum refusée dans ce type d’école' },
]

/**
 * Chemin concret d'une route à paramètres, avec les ids du jeu.
 * @returns {{ chemin: string } | { rouge: string } | { nonTeste: string }}
 */
function concret(route, role, attendu) {
  if (!route.chemin.includes(':')) return { chemin: route.chemin }
  const lecon = role === 'etudiant' ? jeu.lecons?.publiee : jeu.lecons?.brouillon
  const contexte = `${route.chemin} ${route.nom ?? ''}`.toLowerCase()
  let issue = null
  const chemin = route.chemin.replace(/:([A-Za-z]+)(\([^)]*\))?[*?]?/g, (_, nom) => {
    if (issue) return ''
    if (/token/.test(nom)) { issue = { nonTeste: 'jeton à usage unique : jamais écrit dans le jeu' }; return '' }
    const objet = OBJETS.find((o) => o.motif.test(contexte))
    if (objet) {
      if (jeu[objet.cle]) return jeu[objet.cle]
      // Écran refusé au rôle : le garde refuse avant tout chargement, l'id n'est jamais lu.
      if (!attendu) return ID_FICTIF
      const refus = jeu.manques?.[objet.cle]
      issue = refus ? { rouge: `${objet.manque} : ${refus}` } : { nonTeste: `aucun id « ${objet.cle} » dans le jeu` }
      return ''
    }
    if (/lesson|lecon|chapter|chapitre/.test(contexte) && nom === 'id') {
      if (lecon) return lecon
      issue = { nonTeste: 'aucune leçon dans le jeu de cette école' }
      return ''
    }
    if (/classe|class/.test(contexte)) return jeu.classes[0]
    if (/matiere|subject/.test(contexte)) return jeu.matieres[0]
    issue = { nonTeste: `paramètre « ${nom} » sans donnée dans le jeu` }
    return ''
  })
  return issue ?? { chemin }
}

const navigateur = await chromium.launch()
const resultats = []

for (const { compte, email, role } of COMPTES) {
  const contexte = await navigateur.newContext()
  const page = await contexte.newPage()
  let evenements = null
  const nouveaux = () => ({ pageerror: [], console: [], api: [] })
  page.on('pageerror', (e) => evenements?.pageerror.push(String(e).slice(0, 300)))
  page.on('console', (m) => { if (m.type() === 'error') evenements?.console.push(m.text().slice(0, 300)) })
  page.on('response', (r) => {
    const u = new URL(r.url())
    if (u.pathname.startsWith('/api/')) evenements?.api.push({ statut: r.status(), chemin: u.pathname })
  })

  // Connexion par l'ÉCRAN.
  evenements = nouveaux()
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('#username', email)
  await page.fill('#password', MOT_DE_PASSE)
  await page.click('button[type="submit"]')
  const connecte = await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }).then(() => true, () => false)
  const alerteConnexion = connecte ? '' : (await page.locator('[role="alert"]').allInnerTexts()).join(' ').trim()
  resultats.push({ compte, role, chemin: '/login (connexion)', verdict: connecte ? 'VERT' : 'ROUGE',
    defaut: connecte ? null : `connexion impossible : « ${alerteConnexion || 'aucun message'} »`, api: evenements.api })
  if (!connecte) { await contexte.close(); continue }

  for (const route of routes) {
    if (route.redirection || !route.composant || route.chemin === '/:pathMatch(.*)*') continue
    if (sansObjetSansVisite(route, role, ferme)) {
      resultats.push({ compte, role, chemin: route.chemin, nom: route.nom, verdict: 'SANS OBJET', defaut: 'D56 : contenu d’école, refusé au supradmin par le serveur' })
      continue
    }
    const attendu = ouverte(route, role, ferme)
    if (attendu === null) continue
    const cible = concret(route, role, attendu)
    const cas = { compte, role, chemin: route.chemin, nom: route.nom, capacite: route.capacite, attendu: attendu ? 'ouvert' : 'refusé' }
    if (cible.rouge) { resultats.push({ ...cas, verdict: 'ROUGE', defaut: cible.rouge }); continue }
    if (cible.nonTeste) { resultats.push({ ...cas, verdict: 'NON TESTÉ', defaut: cible.nonTeste }); continue }
    const { chemin } = cible

    evenements = nouveaux()
    await page.goto(`${BASE}${chemin}`, { waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)
    const final = new URL(page.url()).pathname
    const texte = (await page.evaluate(() => {
      const app = document.querySelector('#app')
      if (!app) return ''
      const copie = app.cloneNode(true)
      // Ni icônes, ni chrome de navigation (barre latérale `aside`, barre du haut `nav`/`header`) :
      // le « Classes » d'un menu ne doit pas se lire comme le libellé d'un compteur de l'écran.
      copie.querySelectorAll('[class*="material-icons"], [class*="material-symbols"], .fa, [class^="fa-"], [aria-hidden="true"], aside, nav, header').forEach((n) => n.remove())
      document.body.appendChild(copie)
      copie.style.position = 'absolute'; copie.style.left = '-99999px'
      const t = copie.innerText
      copie.remove()
      return t
    }).catch(() => '')).trim()
    const alertes = (await page.locator('[role="alert"]').allInnerTexts().catch(() => [])).map((t) => t.trim()).filter(Boolean)
    const bruts = BRUT.map((re) => texte.match(re)?.[0]).filter(Boolean)
    const api5xx = evenements.api.filter((a) => a.statut >= 500)
    const capture = `captures/${compte}${route.chemin.replace(/[^a-z0-9]+/gi, '_')}.png`
    await page.screenshot({ path: join(sortie, capture) }).catch(() => {})

    const metier = attendu && refusServeur(route, role)
    if (metier) { const vu = evenements.api.some((a) => a.statut === metier.statut); resultats.push({ ...cas, attendu: 'refusé', verdict: vu ? 'VERT' : 'ROUGE', defaut: vu ? `refus métier du serveur : ${metier.regle}` : `refus ${metier.statut} attendu, non vu : ${metier.regle}`, api: evenements.api, capture }); continue }
    const defauts = []
    if (attendu) {
      if (final !== chemin) {
        if (route.capacite) { resultats.push({ ...cas, verdict: 'NON TESTÉ', defaut: `capacité « ${route.capacite} » absente pour ce compte (redirigé vers ${final})`, capture }); continue }
        if (chemin.startsWith(`${final}/`)) { resultats.push({ ...cas, verdict: 'NON TESTÉ', defaut: `renvoyé vers l’écran parent ${final} : une donnée requise manque dans le jeu`, capture }); continue }
        defauts.push(`redirigé vers ${final}`)
      }
      if (!texte) defauts.push('aucun contenu rendu')
      if (alertes.length) defauts.push(`alerte : « ${alertes.join(' | ').slice(0, 200)} »`)
      else {
        const erreur = ECRAN_ERREUR.map((re) => texte.match(re)?.[0]).find(Boolean)
        if (erreur) defauts.push(`écran d’erreur : « ${erreur.slice(0, 160)} »`)
      }
      if (bruts.length) defauts.push(`texte brut : ${bruts.join(', ')}`)
    } else if (final === chemin) {
      defauts.push('accès NON refusé')
    } else {
      // Refus tenu : le garde a redirigé AVANT de monter l'écran. Ce qui casse ensuite vient de
      // l'écran d'arrivée, déjà jugé dans sa propre case : le compter ici le compterait N fois.
      // Supradmin sur un écran d'école (D126) : le refus est VU, la case reste SANS OBJET (D56).
      const d56 = refusD56(route, role, ferme)
      resultats.push({ ...cas, verdict: d56 ? 'SANS OBJET' : 'VERT', arrivee: final,
        defaut: d56 ? `D56 : contenu d’école ; refus du routeur vérifié (renvoyé vers ${final})` : null,
        noteArrivee: [...evenements.pageerror.slice(0, 1), ...api5xx.map((a) => `${a.statut} ${a.chemin}`)].join(', ') || null, capture })
      continue
    }
    if (evenements.pageerror.length) defauts.push(`pageerror : ${evenements.pageerror[0]}`)
    if (api5xx.length) defauts.push(`API 5xx : ${api5xx.map((a) => `${a.statut} ${a.chemin}`).join(', ')}`)
    const ecarts = ecartsDeValeur(VERIFS, `${compte} ${route.chemin}`, texte)
    if (ecarts) defauts.push(...ecarts)
    resultats.push({ ...cas, verdict: defauts.length ? 'ROUGE' : 'VERT', defaut: defauts.join(' ; ') || null,
      verification: ecarts ? 'valeurs' : 'rendu', api: evenements.api, console: evenements.console, capture })
  }
  await contexte.close()
}
await navigateur.close()

writeFileSync(join(sortie, 'resultats.json'), JSON.stringify(resultats, null, 2))
const compte = (v) => resultats.filter((r) => r.verdict === v).length
const lignes = [
  `## E2E — ${ECOLE_KLASSCI ? 'école KLASSCI (faux KLASSCI « école »)' : 'école créée depuis le LMS'}`, '',
  `Cases : ${resultats.length} — VERT ${compte('VERT')}, ROUGE ${compte('ROUGE')}, NON TESTÉ ${compte('NON TESTÉ')}, SANS OBJET ${compte('SANS OBJET')}`, '',
  '| compte | écran | attendu | verdict | défaut |', '|---|---|---|---|---|',
  ...resultats.map((r) => `| ${r.compte} | \`${r.chemin}\` | ${r.attendu ?? ''} | ${r.verdict} | ${(r.defaut ?? '').replace(/\|/g, '/')} |`),
]
writeFileSync(join(sortie, 'resume.md'), lignes.join('\n') + '\n')
console.log(lignes.slice(0, 3).join('\n'))
