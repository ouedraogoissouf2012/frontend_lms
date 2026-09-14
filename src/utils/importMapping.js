/**
 * Règles de cartographie de l'import d'apprenants (#334).
 *
 * Toutes les règles vivent ici, en fonctions pures : le composable ne fait que
 * les appeler, et elles se couvrent sans monter un seul composant.
 *
 * Elles remplacent un simple booléen `required` par champ, qui ne savait pas
 * exprimer « courriel OU téléphone » — la règle que le serveur applique
 * pourtant à chaque ligne, et que l'écran énonçait déjà en toutes lettres sans
 * jamais la vérifier.
 */
import { IMPORT_FIELDS } from '../constants/importFields'

/** Le serveur refuse toute ligne sans l'un de ces deux moyens de contact. */
export const IDENTITY_FIELDS = ['email', 'telephone']

/**
 * En-têtes reconnus automatiquement, par champ canonique. Comparés sous forme
 * normalisée (sans accent, sans casse, tirets et soulignés valant un espace) :
 * « Prénom » d'un export Excel francophone n'était pas reconnu.
 */
const SYNONYMS = {
  nom: ['nom', 'nom de famille', 'last name'],
  prenom: ['prenom', 'prenoms', 'first name'],
  email: ['email', 'e mail', 'mail', 'courriel', 'adresse email'],
  telephone: ['telephone', 'tel', 'whatsapp', 'numero', 'portable', 'mobile'],
  role: ['role', 'profil'],
  code_classe: ['code classe', 'classe'],
  date_inscription: ['date inscription', 'date d inscription'],
  statut: ['statut', 'status'],
}

function normalizeHeader(header) {
  return String(header ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_']/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function labelOf(field) {
  return IMPORT_FIELDS.find((candidate) => candidate.key === field)?.label ?? field
}

/** Entrées réellement renseignées : une colonne laissée vide n'est pas un choix. */
function filledEntries(mapping) {
  return Object.entries(mapping ?? {}).filter(([, header]) => Boolean(header))
}

/**
 * Deux colonnes de même nom rendent toute cartographie ambiguë, et le serveur
 * refuse le fichier (code `duplicate_header`). Autant le dire ici, avant de
 * faire remplir un formulaire qui ne peut pas aboutir.
 */
function duplicateHeaders(mapping, headers) {
  // Comparaison sur la forme NORMALISÉE, celle que le serveur utilise : pour
  // lui « Nom » et « nom » sont la même colonne. Comparer les chaînes brutes
  // donnerait un feu vert que la requête suivante démentirait aussitôt.
  const named = (headers ?? []).filter(Boolean)
  const formes = named.map((header) => header.trim().toLowerCase())
  const duplicated = [...new Set(named.filter((_, index) => formes.indexOf(formes[index]) !== index))]

  return duplicated.map(
    (header) => `Deux colonnes du fichier s'appellent « ${header} » : renommez-en une dans votre tableur.`,
  )
}

function missingRequired(mapping) {
  const missing = IMPORT_FIELDS
    .filter((field) => field.required && !mapping?.[field.key])
    .map((field) => field.label)

  return missing.length
    ? [`Indiquez la colonne correspondant à : ${missing.join(', ')}.`]
    : []
}

function missingIdentity(mapping) {
  const hasIdentity = IDENTITY_FIELDS.some((field) => mapping?.[field])

  return hasIdentity
    ? []
    : [`Indiquez au moins une colonne ${labelOf('email')} ou ${labelOf('telephone')} : sans l'une des deux, chaque ligne sera refusée.`]
}

function structuralProblems(mapping, headers) {
  const issues = []
  const entries = filledEntries(mapping)
  const known = new Set(headers ?? [])

  const unknown = [...new Set(entries.map(([, header]) => header).filter((header) => !known.has(header)))]
  for (const header of unknown) {
    issues.push(`La colonne « ${header} » n'existe pas dans ce fichier.`)
  }

  const seen = new Map()
  for (const [field, header] of entries) {
    seen.set(header, [...(seen.get(header) ?? []), field])
  }
  for (const [header, fields] of seen) {
    if (fields.length > 1) {
      issues.push(`La colonne « ${header} » est utilisée pour ${fields.map(labelOf).join(' et ')} : choisissez-en une seule.`)
    }
  }

  return issues
}

/**
 * Règles dans l'ordre de leurs prérequis : tant qu'un champ requis manque, se
 * prononcer sur le reste n'apprendrait rien à l'utilisateur. On rend donc le
 * premier obstacle, pas la liste de tout ce qui cloche.
 */
const RULES = [duplicateHeaders, missingRequired, missingIdentity, structuralProblems]

/**
 * Ce qui empêche encore de lancer l'analyse.
 *
 * @param {Record<string, string>} mapping - Champ canonique => en-tête choisi.
 * @param {string[]} headers - En-têtes réellement présents dans le fichier.
 * @returns {string[]} Messages affichables ; tableau vide si la cartographie est bonne.
 */
export function mappingIssues(mapping, headers) {
  for (const rule of RULES) {
    const issues = rule(mapping, headers)
    if (issues.length) return issues
  }

  return []
}

/**
 * Cartographie préremplie à partir des en-têtes du fichier.
 *
 * Un champ déjà attribué n'est pas réattribué : deux en-têtes qui visent le
 * même champ produiraient une cartographie invalide dès l'ouverture.
 *
 * @param {string[]} headers - En-têtes lus dans le fichier.
 * @returns {Record<string, string>} Champ canonique => en-tête d'origine.
 */
export function autoMap(headers) {
  const mapping = {}

  for (const header of headers ?? []) {
    const normalized = normalizeHeader(header)
    const field = IMPORT_FIELDS
      .map((candidate) => candidate.key)
      .find((key) => !mapping[key] && (SYNONYMS[key] ?? []).includes(normalized))

    if (field) mapping[field] = String(header).trim()
  }

  return mapping
}
