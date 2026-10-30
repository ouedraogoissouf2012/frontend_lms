#!/usr/bin/env node
/**
 * Garde « aucune lecture d'une propriété personnalisée définie nulle part »
 * (#442) — runner à cliquet.
 *
 * ## Ce qu'elle empêche
 *
 * `var(--border-color)` était lu 203 fois dans 100 fichiers, et défini nulle
 * part. Le navigateur ne dit rien : la déclaration qui la lit retombe sur ses
 * valeurs initiales. Dans un raccourci `border: 1px solid var(--border-color)`,
 * c'est `border-style: none`, et la bordure n'existait pas, en clair comme en
 * sombre (mesuré à l'écran sur 40 éléments). Ni ESLint, ni Stylelint, ni la
 * suite ne le voient.
 *
 * ## Le cliquet
 *
 * À sa naissance, la garde a trouvé 33 propriétés lues et jamais définies. Elles
 * sont gelées dans `.proprietes-non-definies-baseline.json`, avec leur nombre de
 * lectures : chacune relève de sa propre correction. Une propriété non définie
 * NEUVE échoue, une propriété gelée qui gagne des lectures échoue.
 *
 * Périmètre : `src/**` (.vue, .css, .scss, .js, .ts) et `index.html`.
 *
 * ## Codes de sortie
 *
 *   0  conforme — le dénominateur est imprimé
 *   1  lecture neuve d'une propriété définie nulle part, ou ligne de base absente
 *   2  la garde N'A RIEN LU : aucun fichier, ou aucune lecture de `var(--…)`
 *
 * Usage :
 *   node scripts/lint-proprietes-non-definies.mjs           # contrôle
 *   node scripts/lint-proprietes-non-definies.mjs --update  # régénère la ligne de base
 */
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import {
  analyser,
  comparerALaLigneDeBase,
  estFichierSuivi,
  serialiserLigneDeBase,
  verifierLigneDeBase,
} from './lib/proprietesNonDefinies.mjs'

const RACINE = process.cwd()
const LIGNE_DE_BASE = path.join(RACINE, '.proprietes-non-definies-baseline.json')

async function collecter(dossier) {
  const entrees = await readdir(dossier, { withFileTypes: true })
  const fichiers = []
  for (const entree of entrees) {
    const chemin = path.join(dossier, entree.name)
    if (entree.isDirectory()) fichiers.push(...await collecter(chemin))
    else if (entree.isFile() && estFichierSuivi(entree.name)) fichiers.push(chemin)
  }
  return fichiers
}

async function lireLePerimetre() {
  const chemins = await collecter(path.join(RACINE, 'src'))
  const indexHtml = path.join(RACINE, 'index.html')
  if (existsSync(indexHtml)) chemins.push(indexHtml)

  const fichiers = []
  for (const chemin of chemins.sort()) {
    fichiers.push({ fichier: path.relative(RACINE, chemin), source: await readFile(chemin, 'utf8') })
  }
  return fichiers
}

function chargerLigneDeBase() {
  if (!existsSync(LIGNE_DE_BASE)) return null
  const valeur = JSON.parse(readFileSync(LIGNE_DE_BASE, 'utf8'))
  verifierLigneDeBase(valeur)
  return valeur
}

async function main() {
  const fichiers = await lireLePerimetre()
  const { nonDefinies, lectures, definitions } = analyser(fichiers)

  if (fichiers.length === 0 || lectures === 0) {
    console.error(`x La garde n'a rien lu : ${fichiers.length} fichier(s), ${lectures} propriété(s) lue(s).`)
    process.exitCode = 2
    return
  }

  const denominateur =
    `${fichiers.length} fichier(s) lu(s), ${lectures} propriété(s) lue(s), ${definitions} définie(s)`

  if (process.argv.includes('--update')) {
    await writeFile(LIGNE_DE_BASE, serialiserLigneDeBase(nonDefinies))
    console.log(`OK Ligne de base régénérée : ${Object.keys(nonDefinies).length} propriété(s) gelée(s). ${denominateur}.`)
    return
  }

  const ligneDeBase = chargerLigneDeBase()
  if (ligneDeBase === null) {
    console.error(`x ${path.basename(LIGNE_DE_BASE)} est absent. Lancer "npm run lint:proprietes:baseline" une fois.`)
    process.exitCode = 1
    return
  }

  const { nouvelles, accrues } = comparerALaLigneDeBase(nonDefinies, ligneDeBase)
  if (nouvelles.length === 0 && accrues.length === 0) {
    console.log(
      `OK Aucune lecture neuve d'une propriété définie nulle part. ${denominateur} ; ` +
        `${Object.keys(ligneDeBase).length} propriété(s) gelée(s).`,
    )
    return
  }

  console.error('x Propriétés personnalisées lues et définies nulle part :\n')
  for (const { nom, lectures: n } of nouvelles) console.error(`  ${nom}  ${n} lecture(s), non gelée`)
  for (const { nom, lectures: n, permis } of accrues) console.error(`  ${nom}  ${n} lecture(s), gelée à ${permis}`)
  console.error(
    '\nLire un jeton du thème qui existe (theme/_theme-light.css, _theme-dark.css, _tokens-*.css), ' +
      'ou définir la propriété. Une propriété non définie prend sa valeur initiale, sans aucune erreur.',
  )
  process.exitCode = 1
}

main().catch((erreur) => {
  console.error(erreur)
  process.exitCode = 1
})
