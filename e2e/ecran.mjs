// Lecture d'un écran par l'E2E, commune à toutes les écoles (extrait de e2e/parcours.mjs, sans
// changement de comportement) : texte brut, écran d'erreur, et écarts aux assertions de valeur.

// Texte technique brut à l'écran : une clé en snake_case, une valeur JS non rendue, un message d'axios.
export const BRUT = [
  /\b[a-z]{2,}(?:_[a-z0-9]{2,})+\b/,
  /\b(?:undefined|NaN)\b/,
  // D619 : une date illisible (« Invalid Date », un new Date() sur une heure KLASSCI « HH:mm ») est un texte brut.
  /\bInvalid Date\b/,
  /\[object Object\]/,
  /Request failed with status code/,
  // v3 : un nom de classe d'icône écrit en texte (« fa-book » sur /dashboard, constat du run v2).
  /\bfa-[a-z0-9]+(?:-[a-z0-9]+)*\b/,
  // v3 : un statut anglais brut à l'écran d'une interface française (« published » sur /dashboard).
  /\b(?:published|draft|archived)\b/,
]

// `ou` : 'apres' (le chiffre suit son libellé) ou 'avant' (il le précède, cartes de /admin/users).
export const chiffre = (libelle, attendu, ou = 'apres') => ({ libelle, attendu: [].concat(attendu), ou })

// Écran d'ERREUR sans `role="alert"` (constat du run 42698319144 : /student/dashboard et
// /seances/:id étaient VERTS en affichant « Erreur de chargement » et un bouton « Réessayer »).
export const ECRAN_ERREUR = [
  /Erreur (?:de|lors du) chargement[^\n]*/i,
  /n['’]ont pas pu être chargée?s[^\n]*/i,
  /n['’]a pas pu être chargée?[^\n]*/i,
  /temporairement indisponible[^\n]*/i,
  /Aucun accès KLASSCI[^\n]*/,
  /\bRéessayer\b/,
]

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Écarts entre l'écran et le jeu ; `null` si l'écran n'a pas d'assertion de valeur. */
export function ecartsDeValeur(VERIFS, cle, texte) {
  const v = VERIFS[cle]
  if (!v) return null
  const ecarts = []
  for (const { libelle, attendu, ou } of v.chiffres ?? []) {
    const motif = ou === 'avant'
      ? `([^\\n]+)\\n+\\s*${echapper(libelle)}\\s*(?:\\n|$)`
      : `(?:^|\\n)\\s*${echapper(libelle)}\\s*\\n+\\s*([^\\n]+)`
    const lu = texte.match(new RegExp(motif))?.[1]?.trim()
    if (lu === undefined) ecarts.push(`valeur introuvable : « ${libelle} »`)
    else if (!attendu.includes(Number(lu))) ecarts.push(`« ${libelle} » affiche ${lu}, le jeu en a créé ${attendu.join(' ou ')}`)
  }
  for (const t of v.contient ?? []) if (!texte.includes(t)) ecarts.push(`« ${t} » absent de l’écran`)
  for (const t of v.absent ?? []) if (texte.includes(t)) ecarts.push(`« ${t} » affiché à tort`)
  ecarts.push(...(v.refus ?? []))
  return ecarts
}

// D616 : les textes d'ERREUR du catalogue du front MESURÉ, une seule source. Le faux vert découvert par K4 :
// « La ressource demandée est introuvable. » (notFound), dans un bandeau sans role="alert", passait pour un écran sain.
// Ne sont pas des erreurs : les états vides légitimes (REASONS `etatVide`) et les informations ci-dessous.
export const INFORMATIONS = Object.freeze(['listeActualisee'])

/** Les textes d'erreur du catalogue (ERROR_MESSAGES), sans les états vides légitimes ni les informations. */
export function textesDErreur(messages, raisons) {
  const exclues = new Set([...INFORMATIONS, ...Object.values(raisons).filter((e) => e.etatVide).map((e) => e.categorie)])
  return [...new Set(Object.entries(messages).filter(([cle, t]) => !exclues.has(cle) && typeof t === 'string').map(([, t]) => t))]
}

/** Le premier texte d'erreur du catalogue présent dans le texte de l'écran, ou null. */
export const erreurAffichee = (texte, textes) => textes.find((t) => texte.includes(t)) ?? null

/** Les appels API en 4xx d'un écran, notés dans sa case (`404 /api/...`). */
export const appels4xx = (api) => api.filter((a) => a.statut >= 400 && a.statut < 500).map((a) => `${a.statut} ${a.chemin}`)
