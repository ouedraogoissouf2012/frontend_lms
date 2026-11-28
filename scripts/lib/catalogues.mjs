/**
 * Aucune clé en double dans les catalogues de messages et de motifs (#754), lus dans leur composition FINALE.
 *
 * Pourquoi une garde à part : en JavaScript, la dernière clé d'un objet gagne en silence. Une fusion textuelle qui
 * ajoute deux fois la même clé n'est pas un conflit, et le texte perdu ne fait rougir aucun test. `no-dupe-keys`
 * (désormais actif) voit un doublon DANS un littéral ; il ne voit pas une clé qui arrive aussi par l'étalement
 * (`...autre`) d'un autre module. Cette garde lit chaque catalogue comme du code (arbre syntaxique d'espree), suit
 * chaque étalement jusqu'à l'objet qu'il désigne, dans le même fichier ou par son `import` (chemin relatif ou alias
 * `@/`), et compte les clés de la composition entière.
 *
 * Elle est fail-closed : un étalement qu'elle ne sait pas suivre (un appel, une expression, un cycle), une clé
 * calculée ou un catalogue introuvable sont REFUSÉS, jamais ignorés — une garde qui se tait sur ce qu'elle ne lit pas
 * ne prouve rien.
 */
import { parse } from 'espree'
import { posix } from 'node:path'

/** Les catalogues gardés : le fichier et le nom de l'objet exporté. */
export const CATALOGUES = Object.freeze([
  Object.freeze({ fichier: 'src/constants/errorMessages.js', nom: 'ERROR_MESSAGES' }),
  Object.freeze({ fichier: 'src/services/refusalReasons.js', nom: 'REASONS' }),
])

const OPTIONS = Object.freeze({ ecmaVersion: 'latest', sourceType: 'module', loc: true })

function illisible(fichier, noeud, raison) {
  return new Error(`${fichier}:${noeud?.loc?.start.line ?? '?'} : composition illisible (${raison})`)
}

/** Le chemin du module importé, relatif à la racine du dépôt (`@/` vaut `src/`). */
function resoudre(depuis, specificateur) {
  const chemin = specificateur.startsWith('@/') ? `src/${specificateur.slice(2)}` : posix.join(posix.dirname(depuis), specificateur)
  return posix.normalize(/\.m?js$/.test(chemin) ? chemin : `${chemin}.js`)
}

/** L'objet littéral que désigne `nom` au premier niveau du module (`{…}` ou `Object.freeze({…})`). */
function objetNomme(ast, nom, fichier) {
  for (const instruction of ast.body) {
    const declaration = instruction.type === 'ExportNamedDeclaration' ? instruction.declaration : instruction
    if (declaration?.type !== 'VariableDeclaration') continue
    const declarateur = declaration.declarations.find((d) => d.id.type === 'Identifier' && d.id.name === nom)
    if (!declarateur) continue
    const init = declarateur.init
    const gele = init?.type === 'CallExpression' && init.callee.type === 'MemberExpression'
      && init.callee.object.name === 'Object' && init.callee.property.name === 'freeze'
    const objet = gele ? init.arguments[0] : init
    if (objet?.type !== 'ObjectExpression') throw illisible(fichier, declarateur, `${nom} n'est pas un objet littéral`)
    return objet
  }
  return null
}

/** L'import qui a introduit `nomLocal` dans le module, s'il y en a un. */
function importDe(ast, nomLocal) {
  for (const instruction of ast.body) {
    if (instruction.type !== 'ImportDeclaration') continue
    const specificateur = instruction.specifiers.find((s) => s.local.name === nomLocal)
    if (specificateur) {
      return { source: instruction.source.value, nom: specificateur.type === 'ImportSpecifier' ? specificateur.imported.name : 'default' }
    }
  }
  return null
}

/**
 * Toutes les clés de la composition finale du catalogue, chacune avec son origine (`fichier:ligne`).
 *
 * @param {string} fichier chemin relatif à la racine du dépôt
 * @param {string} nom l'objet nommé dans ce fichier
 * @param {(chemin: string) => string} lire
 * @returns {{ cle: string, origine: string }[]}
 * @throws {Error} sur une composition illisible
 */
export function clesDuCatalogue(fichier, nom, lire, chaine = []) {
  const repere = `${fichier}#${nom}`
  if (chaine.includes(repere)) throw new Error(`${fichier} : composition illisible (cycle d'étalements ${[...chaine, repere].join(' → ')})`)
  const ast = parse(lire(fichier), OPTIONS)
  const objet = objetNomme(ast, nom, fichier)
  if (!objet) throw new Error(`${fichier} : composition illisible (${nom} introuvable)`)

  const entrees = []
  for (const propriete of objet.properties) {
    if (propriete.type === 'SpreadElement') {
      if (propriete.argument.type !== 'Identifier') throw illisible(fichier, propriete, `étalement d'un ${propriete.argument.type}`)
      const importe = importDe(ast, propriete.argument.name)
      const [cible, cibleNom] = importe ? [resoudre(fichier, importe.source), importe.nom] : [fichier, propriete.argument.name]
      entrees.push(...clesDuCatalogue(cible, cibleNom, lire, [...chaine, repere]))
      continue
    }
    if (propriete.computed) throw illisible(fichier, propriete, 'clé calculée')
    const cle = propriete.key.type === 'Identifier' ? propriete.key.name : String(propriete.key.value)
    entrees.push({ cle, origine: `${fichier}:${propriete.loc.start.line}` })
  }
  return entrees
}

/**
 * Les clés présentes plus d'une fois, dans l'ordre de leur première apparition.
 *
 * @param {{ cle: string, origine: string }[]} entrees
 * @returns {{ cle: string, origines: string[] }[]}
 */
export function doublons(entrees) {
  const parCle = new Map()
  for (const { cle, origine } of entrees) parCle.set(cle, [...(parCle.get(cle) ?? []), origine])
  return [...parCle].filter(([, origines]) => origines.length > 1).map(([cle, origines]) => ({ cle, origines }))
}

/**
 * Chaque catalogue gardé : ses doublons, ou l'erreur qui empêche de le lire.
 *
 * @param {(chemin: string) => string} lire
 * @returns {{ catalogue: string, cle?: string, origines?: string[], erreur?: string }[]} vide si tout va bien
 */
export function controlerLesCatalogues(lire) {
  const refus = []
  for (const { fichier, nom } of CATALOGUES) {
    const catalogue = `${fichier}#${nom}`
    try {
      for (const doublon of doublons(clesDuCatalogue(fichier, nom, lire))) refus.push({ catalogue, ...doublon })
    } catch (erreur) {
      refus.push({ catalogue, erreur: erreur.message })
    }
  }
  return refus
}
