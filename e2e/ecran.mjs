// Lecture d'un écran par l'E2E, commune à toutes les écoles (extrait de e2e/parcours.mjs, sans
// changement de comportement) : texte brut, écran d'erreur, et écarts aux assertions de valeur.

// Texte technique brut à l'écran : une clé en snake_case, une valeur JS non rendue, un message d'axios.
export const BRUT = [
  /\b[a-z]{2,}(?:_[a-z0-9]{2,})+\b/,
  /\b(?:undefined|NaN)\b/,
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
