/**
 * Logique pure, sans E/S, de la garde « aucune lecture d'une propriété
 * personnalisée définie nulle part » (#442).
 *
 * `var(--x)` d'une propriété jamais définie est invalide au moment du calcul :
 * la déclaration qui la lit retombe sur ses valeurs initiales, sans erreur ni
 * avertissement. Dans un raccourci (`border: 1px solid var(--border-color)`),
 * c'est `border-style: none` : mesuré à l'écran (#442), les bordures n'étaient
 * pas dessinées du tout, parce que `--border-color` n'était défini nulle part.
 *
 * Une lecture est `var(--x` (avec ou sans repli). Une définition est une
 * déclaration `--x:` (CSS, `<style>` d'un `.vue`, clé d'un objet de style lié)
 * ou un `setProperty('--x'`. Un nom construit à l'exécution (`var(--brand-${n})`)
 * n'est ni l'un ni l'autre : il est écarté, car seul l'écran peut le juger.
 *
 * La ligne de base gèle, propriété par propriété, le nombre de lectures des
 * propriétés non définies qui existaient à la naissance de la garde :
 *   { "--propriete": nombreDeLectures }
 * Une propriété non définie qui n'y est pas échoue ; une propriété gelée qui
 * gagne des lectures échoue ; en perdre, ou la définir, est toujours accepté.
 */

const NOM = '--[A-Za-z0-9_-]+'
const LECTURE = new RegExp(`var\\(\\s*(${NOM})(\\$\\{)?`, 'g')
const DECLARATION = new RegExp(`(?:^|[\\s;{"'\`,(])(${NOM})\\s*["'\`]?\\s*:`, 'gm')
const SET_PROPERTY = new RegExp(`setProperty\\(\\s*["'\`](${NOM})["'\`]`, 'g')

const EXTENSIONS_SUIVIES = new Set(['.vue', '.css', '.scss', '.js', '.ts', '.html'])

function estObjetSimple(valeur) {
  return valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)
}

export function estFichierSuivi(fichier) {
  return EXTENSIONS_SUIVIES.has(fichier.slice(fichier.lastIndexOf('.')))
}

/** Les commentaires de bloc (CSS, JS) et HTML ne lisent ni ne définissent rien. */
function sansCommentaires(source) {
  return String(source).replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
}

/** @returns {Map<string, number>} nom -> nombre de lectures, hors noms dynamiques */
export function extraireLectures(source) {
  const lectures = new Map()
  for (const [, nom, interpolation] of sansCommentaires(source).matchAll(LECTURE)) {
    if (interpolation !== undefined) continue
    lectures.set(nom, (lectures.get(nom) ?? 0) + 1)
  }
  return lectures
}

/** @returns {Set<string>} noms définis */
export function extraireDefinitions(source) {
  const texte = sansCommentaires(source)
  const definitions = new Set()
  for (const [, nom] of texte.matchAll(DECLARATION)) definitions.add(nom)
  for (const [, nom] of texte.matchAll(SET_PROPERTY)) definitions.add(nom)
  return definitions
}

/**
 * @param {Array<{fichier: string, source: string}>} fichiers
 * @returns {{ nonDefinies: Record<string, number>, lectures: number, definitions: number }}
 */
export function analyser(fichiers) {
  const lectures = new Map()
  const definitions = new Set()

  for (const { source } of fichiers) {
    for (const [nom, n] of extraireLectures(source)) lectures.set(nom, (lectures.get(nom) ?? 0) + n)
    for (const nom of extraireDefinitions(source)) definitions.add(nom)
  }

  const nonDefinies = Object.create(null)
  for (const nom of [...lectures.keys()].sort()) {
    if (!definitions.has(nom)) nonDefinies[nom] = lectures.get(nom)
  }

  return { nonDefinies, lectures: lectures.size, definitions: definitions.size }
}

export function comparerALaLigneDeBase(nonDefinies, ligneDeBase) {
  const base = estObjetSimple(ligneDeBase) ? ligneDeBase : {}
  const nouvelles = []
  const accrues = []

  for (const [nom, n] of Object.entries(nonDefinies)) {
    const permis = Object.hasOwn(base, nom) ? base[nom] : undefined
    if (permis === undefined) {
      nouvelles.push({ nom, lectures: n })
    } else if (n > permis) {
      accrues.push({ nom, lectures: n, permis, hausse: n - permis })
    }
  }

  const parNom = (a, b) => a.nom.localeCompare(b.nom)
  return { nouvelles: nouvelles.sort(parNom), accrues: accrues.sort(parNom) }
}

export function verifierLigneDeBase(valeur) {
  if (!estObjetSimple(valeur)) {
    throw new Error('ligne de base invalide : attendu un objet { "--propriete": lectures }')
  }
  for (const [nom, n] of Object.entries(valeur)) {
    if (!new RegExp(`^${NOM}$`).test(nom)) {
      throw new Error(`ligne de base invalide : « ${nom} » n'est pas un nom de propriété personnalisée`)
    }
    if (!Number.isSafeInteger(n) || n < 1) {
      throw new Error(`ligne de base invalide : « ${nom} » a un nombre de lectures non valide (${JSON.stringify(n)})`)
    }
  }
}

export function serialiserLigneDeBase(nonDefinies) {
  const triee = Object.create(null)
  for (const nom of Object.keys(nonDefinies).sort()) triee[nom] = nonDefinies[nom]
  return JSON.stringify(triee, null, 2) + '\n'
}
