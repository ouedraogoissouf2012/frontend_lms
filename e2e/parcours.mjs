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

const [fichierRoutes, fichierJeu, sortie] = process.argv.slice(2)
const BASE = 'http://127.0.0.1:4173'
const MOT_DE_PASSE = process.env.E2E_MOT_DE_PASSE
const routes = JSON.parse(readFileSync(fichierRoutes, 'utf8'))
const jeu = JSON.parse(readFileSync(fichierJeu, 'utf8'))
mkdirSync(join(sortie, 'captures'), { recursive: true })

// Compte → rôle canonique du routeur.
const COMPTES = [
  { compte: 'supradmin', email: process.env.E2E_SUPRADMIN_EMAIL, role: 'supradmin' },
  { compte: 'admin', email: jeu.comptes.admin, role: 'admin' },
  { compte: 'coordinateur', email: jeu.comptes.coordinateur, role: 'coordinateur' },
  { compte: 'enseignant', email: jeu.comptes.enseignant, role: 'enseignant' },
  { compte: 'etudiant', email: jeu.comptes.etudiant, role: 'etudiant' },
  { compte: 'etudiant_inactif', email: jeu.comptes.etudiant_inactif, role: 'etudiant' },
]

// Texte technique brut à l'écran : une clé en snake_case, une valeur JS non rendue, un message d'axios.
const BRUT = [
  /\b[a-z]{2,}(?:_[a-z0-9]{2,})+\b/,
  /\b(?:undefined|NaN)\b/,
  /\[object Object\]/,
  /Request failed with status code/,
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
  const lecon = role === 'etudiant' ? jeu.lecons.publiee : jeu.lecons.brouillon
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
    if (/lesson|lecon|chapter|chapitre/.test(contexte) && nom === 'id') return lecon
    if (/classe|class/.test(contexte)) return jeu.classes[0]
    if (/matiere|subject/.test(contexte)) return jeu.matieres[0]
    issue = { nonTeste: `paramètre « ${nom} » sans donnée dans le jeu` }
    return ''
  })
  return issue ?? { chemin }
}

// Assertions de VALEUR (D110) : sur les écrans dont le jeu connaît la réponse, un vert exige que
// l'écran DISE VRAI. Sans elles, un vert prouve seulement « rendu sans erreur » (constat du run 7 :
// « Leçons Créées 0 » pour un enseignant qui en a créé 3). Les valeurs viennent du montage
// (e2e/ecole-lms.ps1) : ens1 a 2 matières dans 2 classes (4 + 2 élèves, dont 1 rendu inactif),
// 3 leçons (publiée, brouillon, archivée), 1 séance demain, 1 sujet de forum ; ens2 a publié
// « Lecture suivie » dans la classe de l'élève 1.
const chiffre = (libelle, attendu) => ({ libelle, attendu: [].concat(attendu) })
const VERIFS = {
  'enseignant /teacher/dashboard': {
    chiffres: [chiffre('Matières Enseignées', 2), chiffre('Classes', 2), chiffre('Leçons Créées', 3), chiffre('Étudiants Totaux', [5, 6]),
      ...(jeu.seance ? [chiffre('Séances à venir', 1)] : [])],
  },
  'enseignant /teacher/lessons': {
    chiffres: [chiffre('Total', 3), chiffre('Publiées', 1), chiffre('Brouillons', 1), chiffre('Archivées', 1)],
    contient: ['Fractions, introduction', 'Fractions, exercices'],
    // D72 : « Mes leçons » ne montre pas les leçons d'un collègue.
    absent: ['Lecture suivie', 'Matière inconnue'],
  },
  'etudiant /student/courses': {
    contient: ['Fractions, introduction', 'Lecture suivie', '2 cours'],
    absent: ['Fractions, exercices', 'La cellule, ancien cours'],
  },
  'admin /admin/classes': {
    chiffres: [chiffre('Total Classes', 2), chiffre('Total Étudiants', [5, 6])],
    contient: ['6e A E2E', '5e B E2E'],
  },
  ...(jeu.sujet ? {
    'enseignant /forum': { contient: ['Question sur les fractions'] },
    'etudiant /forum': { contient: ['Question sur les fractions'] },
  } : {}),
}

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Écarts entre l'écran et le jeu ; `null` si l'écran n'a pas d'assertion de valeur. */
function ecartsDeValeur(cle, texte) {
  const v = VERIFS[cle]
  if (!v) return null
  const ecarts = []
  for (const { libelle, attendu } of v.chiffres ?? []) {
    const lu = texte.match(new RegExp(`(?:^|\\n)\\s*${echapper(libelle)}\\s*\\n+\\s*([^\\n]+)`))?.[1]?.trim()
    if (lu === undefined) ecarts.push(`valeur introuvable : « ${libelle} »`)
    else if (!attendu.includes(Number(lu))) ecarts.push(`« ${libelle} » affiche ${lu}, le jeu en a créé ${attendu.join(' ou ')}`)
  }
  for (const t of v.contient ?? []) if (!texte.includes(t)) ecarts.push(`« ${t} » absent de l’écran`)
  for (const t of v.absent ?? []) if (texte.includes(t)) ecarts.push(`« ${t} » affiché à tort`)
  return ecarts
}

function ouverte(route, role) {
  if (route.invite) return null // écran d'invité : hors matrice des rôles connectés
  if (route.roles) return route.roles.includes(role)
  return true // authentifié sans restriction de rôle, ou public
}

// Le garde du routeur laisse passer le supradmin PARTOUT (constants/roles.js, canActivate :
// `hasRole(...) || isSupradmin(user)`). Le contenu d'une école lui est refusé par le SERVEUR (D56) :
// un écran d'école qui ne le nomme pas dans ses rôles est donc SANS OBJET pour lui, pas un défaut.
function sansObjetD56(route, role) {
  return role === 'supradmin' && Array.isArray(route.roles) && !route.roles.includes('supradmin')
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
    if (sansObjetD56(route, role)) {
      resultats.push({ compte, role, chemin: route.chemin, nom: route.nom, verdict: 'SANS OBJET', defaut: 'D56 : contenu d’école, refusé au supradmin par le serveur' })
      continue
    }
    const attendu = ouverte(route, role)
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
      copie.querySelectorAll('[class*="material-icons"], [class*="material-symbols"], .fa, [class^="fa-"], [aria-hidden="true"]').forEach((n) => n.remove())
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

    const defauts = []
    if (attendu) {
      if (final !== chemin) {
        if (route.capacite) { resultats.push({ ...cas, verdict: 'NON TESTÉ', defaut: `capacité « ${route.capacite} » absente pour ce compte (redirigé vers ${final})`, capture }); continue }
        if (chemin.startsWith(`${final}/`)) { resultats.push({ ...cas, verdict: 'NON TESTÉ', defaut: `renvoyé vers l’écran parent ${final} : une donnée requise manque dans le jeu`, capture }); continue }
        defauts.push(`redirigé vers ${final}`)
      }
      if (!texte) defauts.push('aucun contenu rendu')
      if (alertes.length) defauts.push(`alerte : « ${alertes.join(' | ').slice(0, 200)} »`)
      if (bruts.length) defauts.push(`texte brut : ${bruts.join(', ')}`)
    } else if (final === chemin) {
      defauts.push('accès NON refusé')
    } else {
      // Refus tenu : le garde a redirigé AVANT de monter l'écran. Ce qui casse ensuite vient de
      // l'écran d'arrivée, déjà jugé dans sa propre case : le compter ici le compterait N fois.
      resultats.push({ ...cas, verdict: 'VERT', defaut: null, arrivee: final,
        noteArrivee: [...evenements.pageerror.slice(0, 1), ...api5xx.map((a) => `${a.statut} ${a.chemin}`)].join(', ') || null, capture })
      continue
    }
    if (evenements.pageerror.length) defauts.push(`pageerror : ${evenements.pageerror[0]}`)
    if (api5xx.length) defauts.push(`API 5xx : ${api5xx.map((a) => `${a.statut} ${a.chemin}`).join(', ')}`)
    const ecarts = ecartsDeValeur(`${compte} ${route.chemin}`, texte)
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
  `## E2E — école créée depuis le LMS`, '',
  `Cases : ${resultats.length} — VERT ${compte('VERT')}, ROUGE ${compte('ROUGE')}, NON TESTÉ ${compte('NON TESTÉ')}, SANS OBJET ${compte('SANS OBJET')}`, '',
  '| compte | écran | attendu | verdict | défaut |', '|---|---|---|---|---|',
  ...resultats.map((r) => `| ${r.compte} | \`${r.chemin}\` | ${r.attendu ?? ''} | ${r.verdict} | ${(r.defaut ?? '').replace(/\|/g, '/')} |`),
]
writeFileSync(join(sortie, 'resume.md'), lignes.join('\n') + '\n')
console.log(lignes.slice(0, 3).join('\n'))
