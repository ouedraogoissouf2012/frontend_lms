#!/usr/bin/env node
/**
 * Garde « aucune lecture d'une clé qui n'existe pas » — runner à cliquet.
 *
 * ## Ce qu'elle empêche
 *
 * Qu'un écran lise une clé que l'API n'envoie pas. Quatre fois en trois jours,
 * un `|| 0` ou un `|| ''` a transformé l'absence en valeur plausible :
 *
 *   statistiques.total_lecons   -> « Leçons Créées : 0 » alors que le LMS
 *                                  répondait 2 dans le même chargement (#371)
 *   user.nom / user.prenom      -> nom VIDE dans la barre latérale, sur toutes
 *                                  les pages et pour tous les rôles (#372)
 *   statistiques.total_etudiants -> six tuiles à zéro (#365)
 *
 * `payload.cle_qui_nexiste_pas` est du JavaScript valide : ni ESLint, ni la
 * suite, ni la revue ne peuvent le voir. Seule une comparaison à la charge
 * RÉELLEMENT MESURÉE tranche.
 *
 * ## La vérité vient des fixtures, pas de ce script
 *
 * Les clés autorisées sont dérivées de `tests/fixtures/**`, qui sont des
 * réponses capturées avec leur provenance. Ajouter un champ au backend puis à
 * la fixture suffit à l'autoriser : la garde suit la réalité, elle ne la
 * décrète pas.
 *
 * ## Codes de sortie
 *
 *   0  conforme — le dénominateur est imprimé
 *   1  lecture neuve d'une clé inexistante
 *   2  la garde N'A PAS PU TRAVAILLER (fixture illisible, rien à inspecter,
 *      baseline absente)
 *
 * `exit 2` distingue « rien à redire » de « je n'ai rien regardé » — la leçon
 * du backend #701, où deux gardes affichaient « ✓ » sans inspecter un fichier.
 *
 * Usage :
 *   node scripts/lint-cles-inexistantes.mjs           contrôle
 *   node scripts/lint-cles-inexistantes.mjs --update  met le cliquet à jour
 */
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import {
  RECEVEURS,
  clesAutorisees,
  construireBaseline,
  inspecter,
  nouvelles,
  total,
} from './lib/clesInexistantes.mjs'

const RACINE = process.cwd()
const PERIMETRE = ['src', 'tests']
const BASELINE = path.join(RACINE, '.cles-inexistantes-baseline.json')

function versPosix(p) {
  return path.relative(RACINE, p).split(path.sep).join('/')
}

async function collecter(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (!/node_modules/.test(e.name)) await collecter(p, acc)
    } else if (/\.(vue|js|mjs)$/.test(e.name)) acc.push(p)
  }
  return acc
}

function echec(message, code) {
  console.error(message)
  process.exitCode = code
}

/** Charge chaque fixture et en dérive l'ensemble des clés autorisées. */
async function chargerReceveurs() {
  const prets = []
  for (const r of RECEVEURS) {
    const abs = path.join(RACINE, r.fixture)
    if (!existsSync(abs)) {
      throw new Error(`fixture introuvable : ${r.fixture} (destinataire « ${r.nom} »)`)
    }
    const mod = await import(pathToFileURL(abs).href)
    const autorisees = clesAutorisees(mod, r)
    if (autorisees.size === 0) {
      throw new Error(`la fixture ${r.fixture} ne rend AUCUNE cle pour « ${r.nom} »`)
    }
    prets.push({ nom: r.nom, motif: r.motif, portee: r.portee, horsPortee: r.horsPortee, autorisees })
  }
  return prets
}

async function main() {
  let receveurs
  try {
    receveurs = await chargerReceveurs()
  } catch (e) {
    echec(`x Garde cles inexistantes : ${e.message}\nLa garde n'a pas pu travailler — ce n'est PAS un succes.`, 2)
    return
  }

  const fichiers = []
  for (const racine of PERIMETRE) await collecter(path.join(RACINE, racine), fichiers)

  if (fichiers.length === 0) {
    echec(`x Aucun fichier inspecte sous ${PERIMETRE.join('/, ')}/.\nLa garde n'a pas pu travailler.`, 2)
    return
  }

  const violations = []
  for (const f of fichiers) {
    violations.push(...inspecter(versPosix(f), await readFile(f, 'utf8'), receveurs))
  }
  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

  const denominateur =
    `${fichiers.length} fichiers inspectes, ` +
    receveurs.map((r) => `${r.autorisees.size} cles connues pour « ${r.nom} »`).join(', ')

  if (process.argv.includes('--update')) {
    const b = construireBaseline(violations)
    await writeFile(BASELINE, `${JSON.stringify(b, null, 2)}\n`)
    console.log(`OK Baseline regeneree : ${total(b)} lecture(s) gelee(s) dans ${Object.keys(b).length} fichier(s) (${denominateur})`)
    return
  }

  if (!existsSync(BASELINE)) {
    echec(`x ${path.basename(BASELINE)} absent. Lancer une fois "npm run lint:cles:baseline".`, 2)
    return
  }

  let baseline
  try {
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
  } catch {
    echec(`x ${path.basename(BASELINE)} illisible. La garde n'a pas pu travailler.`, 2)
    return
  }

  const neuves = nouvelles(violations, baseline)

  if (neuves.length === 0) {
    console.log(`OK Aucune lecture d'une cle inexistante. (${denominateur}, ${total(baseline)} heritee(s) gelee(s).)`)
    return
  }

  console.error(`x ${neuves.length} lecture(s) d'une cle que l'API n'envoie pas (${denominateur}) :\n`)
  let dernier = null
  for (const v of neuves) {
    if (v.file !== dernier) {
      console.error(`  ${v.file}`)
      dernier = v.file
    }
    console.error(`    ${String(v.line).padStart(4)}  ${v.cle.padEnd(22)} ${v.extrait}`)
    console.error(`          ^ absente de la charge « ${v.receveur} »`)
  }
  console.error(
    `\nUne cle absente lue avec un repli (|| 0, || '') devient une valeur plausible,` +
      `\net l'ecran ment sans que rien n'echoue. C'est arrive quatre fois : #365, #371, #372.` +
      `\n\nSi la cle existe VRAIMENT, ajoute-la a la fixture concernee — mais seulement` +
      `\napres l'avoir mesuree contre le vrai serveur. Une fixture ecrite de memoire` +
      `\nrouvre exactement le trou que cette garde ferme.`,
  )
  process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 2
})
