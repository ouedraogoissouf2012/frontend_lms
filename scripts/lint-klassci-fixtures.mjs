#!/usr/bin/env node
/**
 * Garde des fixtures KLASSCI — runner à cliquet.
 *
 * ## Ce qu'elle empêche
 *
 * Qu'un test écrive **de mémoire** une charge KLASSCI. Quinze fichiers le
 * faisaient ; l'un d'eux inventait six clés que l'API n'envoie pas
 * (`total_etudiants`, `total_lecons`, `corrections_effectuees`,
 * `visio_effectuees`, `messages_forum`, `seances`). Le test était vert et
 * l'écran affichait six zéros en production.
 *
 * C'est un angle mort structurel : un test qui écrit lui-même sa donnée
 * d'entrée ne peut pas découvrir qu'elle est fausse. Ni ESLint, ni la suite,
 * ni la revue ne le voient — seule une charge *capturée* fait foi.
 *
 * ## La règle
 *
 * Un test qui consomme KLASSCI importe ses charges de `tests/fixtures/klassci/`.
 * Ce module ne contient que des réponses réellement capturées, avec leur
 * provenance (date, compte, endpoint).
 *
 * ## Cliquet, et pas refus sec
 *
 * Une garde qui rougit au premier run est désactivée dans la semaine. Le dépôt
 * a déjà tranché ce point trois fois (`lint-ocp`, `lint-dewrap`,
 * `check-file-size`) : la dette existante est gelée et ne peut que décroître.
 * Toute charge inventée **neuve** fait rougir la CI.
 *
 * ## Codes de sortie
 *
 *   0  conforme — le dénominateur est imprimé
 *   1  charge inventée neuve
 *   2  la garde N'A PAS PU TRAVAILLER (rien à inspecter, baseline absente/illisible)
 *
 * `exit 2` distingue « rien à redire » de « je n'ai rien regardé ». C'est la
 * leçon des deux gardes de taille du backend, qui affichaient « ✓ » sans avoir
 * inspecté un seul fichier (#701).
 *
 * Le cœur pur vit dans `scripts/lib/klassciFixtureRatchet.mjs` et son test de
 * ROUGISSEMENT dans `tests/unit/klassciFixtureRatchet.test.js` — une garde sans
 * test de rougissement n'est pas une garde.
 *
 * Usage :
 *   node scripts/lint-klassci-fixtures.mjs           contrôle
 *   node scripts/lint-klassci-fixtures.mjs --update  met le cliquet à jour
 */
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import {
  construireBaseline,
  inspecter,
  nouvelles,
  total,
} from './lib/klassciFixtureRatchet.mjs'

const REPO_ROOT = process.cwd()
const SCAN_ROOT = 'tests'
const BASELINE_FILE = path.join(REPO_ROOT, '.klassci-fixture-baseline.json')

function versPosix(chemin) {
  return path.relative(REPO_ROOT, chemin).split(path.sep).join('/')
}

async function collecter(dossier) {
  if (!existsSync(dossier)) return []
  const entrees = await readdir(dossier, { withFileTypes: true })
  const fichiers = []
  for (const entree of entrees) {
    const complet = path.join(dossier, entree.name)
    if (entree.isDirectory()) {
      fichiers.push(...(await collecter(complet)))
    } else if (entree.isFile() && /\.test\.m?js$/.test(versPosix(complet))) {
      fichiers.push(complet)
    }
  }
  return fichiers
}

function echec(message, code) {
  console.error(message)
  process.exitCode = code
}

async function main() {
  const fichiers = await collecter(path.join(REPO_ROOT, SCAN_ROOT))

  if (fichiers.length === 0) {
    echec(
      `x Garde fixtures KLASSCI : aucun fichier de test inspecte sous ${SCAN_ROOT}/.\n` +
        `La garde n'a pas pu travailler — ce n'est PAS un succes.`,
      2,
    )
    return
  }

  const violations = []
  for (const fichier of fichiers) {
    violations.push(...inspecter(versPosix(fichier), await readFile(fichier, 'utf8')))
  }
  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

  if (process.argv.includes('--update')) {
    const baseline = construireBaseline(violations)
    await writeFile(BASELINE_FILE, `${JSON.stringify(baseline, null, 2)}\n`)
    console.log(
      `OK Baseline regeneree : ${total(baseline)} charge(s) KLASSCI ecrite(s) a la main, ` +
        `gelee(s) dans ${Object.keys(baseline).length} fichier(s) ` +
        `(${fichiers.length} fichiers inspectes) -> ${path.basename(BASELINE_FILE)}`,
    )
    return
  }

  if (!existsSync(BASELINE_FILE)) {
    echec(
      `x ${path.basename(BASELINE_FILE)} absent. Lancer une fois ` +
        `"npm run lint:klassci-fixtures:baseline".`,
      2,
    )
    return
  }

  let baseline
  try {
    baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
  } catch {
    echec(`x ${path.basename(BASELINE_FILE)} illisible. La garde n'a pas pu travailler.`, 2)
    return
  }

  const neuves = nouvelles(violations, baseline)

  if (neuves.length === 0) {
    console.log(
      `OK Aucune charge KLASSCI inventee. ` +
        `(${fichiers.length} fichiers inspectes, ${total(baseline)} charge(s) heritee(s) gelee(s).)`,
    )
    return
  }

  console.error(
    `x ${neuves.length} charge(s) KLASSCI ecrite(s) a la main ` +
      `(${fichiers.length} fichiers inspectes) :\n`,
  )
  let dernierFichier = null
  for (const v of neuves) {
    if (v.file !== dernierFichier) {
      console.error(`  ${v.file}`)
      dernierFichier = v.file
    }
    console.error(`    ${v.line}  ${v.marqueur}   ${v.extrait}`)
  }
  console.error(
    `\nUne charge ecrite de memoire finit par decrire une API qui n'existe pas :` +
      `\nla fixture de useTeacherStats inventait SIX cles, le test etait vert, et` +
      `\nl'ecran affichait six zeros en production.` +
      `\n\nImporter depuis tests/fixtures/klassci/ — les charges y sont CAPTUREES,` +
      `\navec leur provenance. Pour en ajouter une : appeler l'endpoint avec un vrai` +
      `\njeton, coller la reponse, noter la date et le compte.`,
  )
  process.exitCode = 1
}

main().catch((erreur) => {
  console.error(erreur)
  process.exitCode = 2
})
